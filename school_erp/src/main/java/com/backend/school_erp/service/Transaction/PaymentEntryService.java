package com.backend.school_erp.service.Transaction;

import com.backend.school_erp.DTO.Transaction.PaymentEntryDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Transaction.PaymentEntry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class PaymentEntryService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating HikariCP DataSource for school: {}", id);
            HikariConfig config = new HikariConfig();

            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");

            config.setMaximumPoolSize(15);
            config.setMinimumIdle(5);
            config.setIdleTimeout(30000);
            config.setMaxLifetime(1800000);
            config.setConnectionTimeout(30000);
            config.setValidationTimeout(5000);
            config.setLeakDetectionThreshold(10000);

            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private void ensureTablesExist(JdbcTemplate jdbc) {
        try {
            // REMOVED transaction_id
            String createPaymentEntries = """
                CREATE TABLE IF NOT EXISTS payment_entries (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    entry_no VARCHAR(10) NOT NULL,
                    date DATE NOT NULL,
                    expense_name VARCHAR(255) NOT NULL,
                    account_head VARCHAR(255) NOT NULL,
                    receiver_name VARCHAR(255) NOT NULL,
                    description TEXT,
                    payment_mode VARCHAR(50) NOT NULL,
                    reference_id VARCHAR(255),
                    amount DECIMAL(12,2) NOT NULL,
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_entry (entry_no, school_id, academic_year),
                    INDEX idx_school_academic (school_id, academic_year),
                    INDEX idx_entry_no (entry_no),
                    INDEX idx_date (date),
                    INDEX idx_receiver (receiver_name),
                    INDEX idx_account_head (account_head)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """;

            String createDayBook = """
                CREATE TABLE IF NOT EXISTS day_book (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    br_number VARCHAR(100) NOT NULL,
                    admission_number VARCHAR(50) DEFAULT 'N/A',
                    name VARCHAR(255) NOT NULL,
                    br_date TIMESTAMP NOT NULL,
                    description VARCHAR(500),
                    ledger VARCHAR(255) NOT NULL,
                    credit DECIMAL(12,2) DEFAULT 0.00,
                    debit DECIMAL(12,2) DEFAULT 0.00,
                    mode VARCHAR(50) NOT NULL,
                    operator_name VARCHAR(255) NOT NULL,
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_br_number (br_number),
                    INDEX idx_school_academic (school_id, academic_year),
                    INDEX idx_br_date (br_date),
                    INDEX idx_name (name),
                    INDEX idx_ledger (ledger)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """;

            jdbc.execute(createPaymentEntries);
            jdbc.execute(createDayBook);

            log.info("✅ Payment entry and day_book tables created or already exist");
        } catch (Exception e) {
            log.error("❌ Failed to create tables: {}", e.getMessage());
            throw new RuntimeException("Database table creation failed: " + e.getMessage(), e);
        }
    }

    private String generateEntryNo(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        try {
            String lastEntrySql = """
                SELECT entry_no FROM payment_entries 
                WHERE school_id = ? AND academic_year = ? 
                ORDER BY CAST(entry_no AS UNSIGNED) DESC 
                LIMIT 1
            """;

            String lastEntryNo = null;
            try {
                lastEntryNo = jdbc.queryForObject(lastEntrySql, String.class, schoolId, academicYear);
            } catch (Exception e) {
                log.debug("No previous entries found, starting from 0001");
            }

            int nextNumber;
            if (lastEntryNo != null) {
                nextNumber = Integer.parseInt(lastEntryNo);
                nextNumber++;

                if (nextNumber > 5000) {
                    nextNumber = 1;
                }
            } else {
                nextNumber = 1;
            }

            return String.format("%04d", nextNumber);

        } catch (Exception e) {
            log.error("Error generating entry number: {}", e.getMessage());
            Integer count = getEntryCount(schoolId, academicYear);
            int nextNumber = (count % 5000) + 1;
            return String.format("%04d", nextNumber);
        }
    }

    public Integer getLastEntryNo(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        try {
            String sql = """
                SELECT CAST(entry_no AS UNSIGNED) 
                FROM payment_entries 
                WHERE school_id = ? AND academic_year = ? 
                ORDER BY CAST(entry_no AS UNSIGNED) DESC 
                LIMIT 1
            """;
            Integer lastEntryNo = jdbc.queryForObject(sql, Integer.class, schoolId, academicYear);
            return lastEntryNo != null ? lastEntryNo : 0;
        } catch (Exception e) {
            log.warn("Error getting last entry number, returning 0", e);
            return 0;
        }
    }

    public Integer getEntryCount(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        try {
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM payment_entries WHERE school_id = ? AND academic_year = ?",
                    Integer.class,
                    schoolId, academicYear
            );
            return count != null ? count : 0;
        } catch (Exception e) {
            log.warn("Error getting entry count, returning 0", e);
            return 0;
        }
    }

    @Transactional
    public PaymentEntry savePayment(String schoolId, PaymentEntryDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        String entryNo = dto.getEntryNo() != null ?
                String.format("%04d", dto.getEntryNo()) :
                generateEntryNo(schoolId, dto.getAcademicYear());

        LocalDate paymentDate;
        try {
            paymentDate = LocalDate.parse(dto.getDate(), dateFormatter);
        } catch (Exception e) {
            paymentDate = LocalDate.now();
            log.warn("Invalid date format, using current date");
        }

        String paymentSubHead = "";
        try {
            java.lang.reflect.Field subHeadField = dto.getClass().getDeclaredField("paymentSubHead");
            subHeadField.setAccessible(true);
            paymentSubHead = (String) subHeadField.get(dto);
        } catch (Exception e) {
            log.warn("paymentSubHead field not found in DTO, using expenseName as account_head");
            paymentSubHead = dto.getExpenseName();
        }

        // REMOVED transaction_id
        String insertPaymentSQL = """
            INSERT INTO payment_entries 
            (entry_no, date, expense_name, account_head, receiver_name, description, 
             payment_mode, reference_id, amount, school_id, academic_year) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        int rows = jdbc.update(insertPaymentSQL,
                entryNo,
                paymentDate.toString(),
                dto.getExpenseName(),
                paymentSubHead,
                dto.getReceiverName(),
                dto.getDescription(),
                dto.getPaymentMode(),
                dto.getReferenceId(),
                dto.getAmount(),
                schoolId,
                dto.getAcademicYear()
        );

        if (rows == 0) {
            throw new RuntimeException("Failed to insert payment entry");
        }

        insertDayBookEntry(jdbc, schoolId, dto.getAcademicYear(), entryNo, paymentDate, dto, dto.getExpenseName());

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        // Removed transaction_id from builder
        return PaymentEntry.builder()
                .id(lastId)
                .entryNo(Integer.parseInt(entryNo))
                .date(paymentDate.toString())
                .expenseName(dto.getExpenseName())
                .accountHead(paymentSubHead)
                .receiverName(dto.getReceiverName())
                .description(dto.getDescription())
                .paymentMode(dto.getPaymentMode())
                .referenceId(dto.getReferenceId())
                .amount(dto.getAmount())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .createdAt(LocalDateTime.now())
                .build();
    }

    private void insertDayBookEntry(JdbcTemplate jdbc, String schoolId, String academicYear,
                                    String entryNo, LocalDate paymentDate, PaymentEntryDTO dto, String ledgerName) {

        String operatorName = "System Operator";
        String brDescription = dto.getDescription() != null ? dto.getDescription() : "Payment Entry";

        String insertDayBookSQL = """
            INSERT INTO day_book (
                br_number, admission_number, name, br_date, description, 
                ledger, credit, debit, mode, operator_name, school_id, academic_year
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try {
            // FIX: Using atTime(LocalTime.now()) ensures the Date is correct (31st) and includes current time
            // This prevents the timezone offset from rolling it back to the 30th at midnight.
            java.sql.Timestamp dbTimestamp = java.sql.Timestamp.valueOf(paymentDate.atTime(java.time.LocalTime.now()));

            jdbc.update(insertDayBookSQL,
                    entryNo,
                    "N/A",
                    dto.getReceiverName(),
                    dbTimestamp,
                    brDescription,
                    ledgerName,
                    0.00,
                    dto.getAmount(),
                    dto.getPaymentMode(),
                    operatorName,
                    schoolId,
                    academicYear
            );

            log.info("✅ Day book entry created for payment: {}, Debit: {}, Ledger (MainHead): {}",
                    entryNo, dto.getAmount(), ledgerName);
        } catch (Exception e) {
            log.error("❌ Failed to create day book entry: {}", e.getMessage());
            throw new RuntimeException("Failed to create accounting entry: " + e.getMessage(), e);
        }
    }

    public PaymentEntry searchByEntryNo(String schoolId, String academicYear, Integer entryNo) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        try {
            String formattedEntryNo = String.format("%04d", entryNo);
            return jdbc.queryForObject(
                    "SELECT * FROM payment_entries WHERE school_id = ? AND academic_year = ? AND entry_no = ?",
                    new BeanPropertyRowMapper<>(PaymentEntry.class),
                    schoolId, academicYear, formattedEntryNo
            );
        } catch (Exception e) {
            log.info("No payment entry found for entryNo: {} in school: {}", entryNo, schoolId);
            return null;
        }
    }

    public Map<String, Object> getPaymentHistory(String schoolId, String academicYear, Integer entryNo) {
        Map<String, Object> result = new HashMap<>();
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        try {
            String formattedEntryNo = String.format("%04d", entryNo);
            PaymentEntry payment = jdbc.queryForObject(
                    "SELECT * FROM payment_entries WHERE school_id = ? AND academic_year = ? AND entry_no = ?",
                    new BeanPropertyRowMapper<>(PaymentEntry.class),
                    schoolId, academicYear, formattedEntryNo
            );

            if (payment != null) {
                result.put("payment", payment);
                String dayBookSql = """
                    SELECT * FROM day_book 
                    WHERE school_id = ? AND academic_year = ? AND br_number = ?
                """;
                try {
                    Map<String, Object> dayBookEntry = jdbc.queryForMap(
                            dayBookSql,
                            schoolId, academicYear, formattedEntryNo
                    );
                    result.put("dayBookEntry", dayBookEntry);
                } catch (Exception e) {
                    log.debug("No day book entry found for payment: {}", formattedEntryNo);
                }
            }
        } catch (Exception e) {
            log.error("Error fetching payment history: {}", e.getMessage());
        }

        return result;
    }

    public List<Map<String, Object>> getAllPaymentsWithDayBook(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        String sql = """
            SELECT 
                p.*,
                d.br_number as day_book_ref,
                d.br_date as day_book_date,
                d.debit as day_book_amount
            FROM payment_entries p
            LEFT JOIN day_book d ON d.br_number = p.entry_no
                AND d.school_id = p.school_id 
                AND d.academic_year = p.academic_year
            WHERE p.school_id = ? AND p.academic_year = ?
            ORDER BY CAST(p.entry_no AS UNSIGNED) DESC
        """;

        return jdbc.queryForList(sql, schoolId, academicYear);
    }

    @Transactional
    public boolean deletePayment(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        try {
            String getEntryNoSql = "SELECT entry_no FROM payment_entries WHERE id = ? AND school_id = ?";
            String entryNo = jdbc.queryForObject(getEntryNoSql, String.class, id, schoolId);

            if (entryNo != null) {
                String deleteDayBookSql = "DELETE FROM day_book WHERE br_number = ? AND school_id = ?";
                jdbc.update(deleteDayBookSql, entryNo, schoolId);

                String deletePaymentSql = "DELETE FROM payment_entries WHERE id = ? AND school_id = ?";
                int rows = jdbc.update(deletePaymentSql, id, schoolId);

                log.info("✅ Deleted payment {} and day book entry {}", id, entryNo);
                return rows > 0;
            }
        } catch (Exception e) {
            log.error("Error deleting payment: {}", e.getMessage());
        }

        return false;
    }

    @Transactional
    public Optional<PaymentEntry> updatePayment(String schoolId, Long id, PaymentEntryDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        PaymentEntry existing = null;
        try {
            existing = jdbc.queryForObject(
                    "SELECT * FROM payment_entries WHERE id = ? AND school_id = ?",
                    new BeanPropertyRowMapper<>(PaymentEntry.class),
                    id, schoolId
            );
        } catch (Exception e) {
            log.error("Payment entry not found: {}", e.getMessage());
            return Optional.empty();
        }

        if (existing == null) {
            return Optional.empty();
        }

        String paymentSubHead = "";
        try {
            java.lang.reflect.Field subHeadField = dto.getClass().getDeclaredField("paymentSubHead");
            subHeadField.setAccessible(true);
            paymentSubHead = (String) subHeadField.get(dto);
        } catch (Exception e) {
            paymentSubHead = dto.getExpenseName();
        }

        int rows = jdbc.update(
                """
                UPDATE payment_entries 
                SET date = ?, expense_name = ?, account_head = ?, receiver_name = ?, 
                    description = ?, payment_mode = ?, reference_id = ?, amount = ?
                WHERE id = ? AND school_id = ?
                """,
                dto.getDate(), dto.getExpenseName(), paymentSubHead, dto.getReceiverName(),
                dto.getDescription(), dto.getPaymentMode(), dto.getReferenceId(), dto.getAmount(),
                id, schoolId
        );

        if (rows == 0) return Optional.empty();

        updateDayBookEntry(jdbc, schoolId, existing.getEntryNo().toString(), dto, dto.getExpenseName());

        return Optional.ofNullable(jdbc.queryForObject(
                "SELECT * FROM payment_entries WHERE id = ?",
                new BeanPropertyRowMapper<>(PaymentEntry.class),
                id
        ));
    }

    private void updateDayBookEntry(JdbcTemplate jdbc, String schoolId, String entryNo,
                                    PaymentEntryDTO dto, String ledgerName) {
        String updateDayBookSQL = """
            UPDATE day_book 
            SET name = ?, description = ?, ledger = ?, debit = ?, mode = ?
            WHERE br_number = ? AND school_id = ?
        """;

        try {
            jdbc.update(updateDayBookSQL,
                    dto.getReceiverName(),
                    dto.getDescription(),
                    ledgerName,
                    dto.getAmount(),
                    dto.getPaymentMode(),
                    entryNo,
                    schoolId
            );
            log.info("✅ Updated day book entry for {}", entryNo);
        } catch (Exception e) {
            log.error("❌ Failed to update day book entry: {}", e.getMessage());
        }
    }

    public List<Map<String, Object>> getDayBookSummary(String schoolId, String academicYear,
                                                       String fromDate, String toDate) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        StringBuilder sql = new StringBuilder("""
            SELECT 
                br_number,
                DATE(br_date) as entry_date,
                name,
                ledger,
                description,
                mode,
                debit,
                operator_name,
                created_at
            FROM day_book 
            WHERE school_id = ? AND academic_year = ? 
            AND br_number REGEXP '^[0-9]{4}$' 
        """);

        List<Object> params = new ArrayList<>();
        params.add(schoolId);
        params.add(academicYear);

        if (fromDate != null && !fromDate.trim().isEmpty()) {
            sql.append(" AND DATE(br_date) >= ?");
            params.add(fromDate);
        }

        if (toDate != null && !toDate.trim().isEmpty()) {
            sql.append(" AND DATE(br_date) <= ?");
            params.add(toDate);
        }

        sql.append(" ORDER BY br_date DESC, br_number DESC");

        return jdbc.queryForList(sql.toString(), params.toArray());
    }
}