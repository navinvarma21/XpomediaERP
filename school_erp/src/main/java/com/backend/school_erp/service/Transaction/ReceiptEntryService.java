package com.backend.school_erp.service.Transaction;

import com.backend.school_erp.DTO.Transaction.ReceiptEntryDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Transaction.ReceiptEntry;
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
public class ReceiptEntryService {

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
            String createReceiptEntries = """
                CREATE TABLE IF NOT EXISTS receipt_entries (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    receipt_no VARCHAR(10) NOT NULL,  -- Stores In0001-In5000 format
                    date DATE NOT NULL,
                    category VARCHAR(255) NOT NULL,      -- Main Head Name
                    account_head VARCHAR(255) NOT NULL,  -- Sub Head Name
                    person_name VARCHAR(255) NOT NULL,
                    description TEXT,
                    receipt_mode VARCHAR(50) NOT NULL,
                    reference_id VARCHAR(255),
                    amount DECIMAL(12,2) NOT NULL,
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_receipt (receipt_no, school_id, academic_year),
                    INDEX idx_school_academic (school_id, academic_year),
                    INDEX idx_receipt_no (receipt_no),
                    INDEX idx_date (date),
                    INDEX idx_person (person_name),
                    INDEX idx_category (category),
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
                    ledger VARCHAR(255) NOT NULL,       -- Stores MAIN HEAD (Category)
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

            jdbc.execute(createReceiptEntries);
            jdbc.execute(createDayBook);

            log.info("✅ Receipt entry and day_book tables created or already exist");
        } catch (Exception e) {
            log.error("❌ Failed to create tables: {}", e.getMessage());
            throw new RuntimeException("Database table creation failed: " + e.getMessage(), e);
        }
    }

    private String generateReceiptNo(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        try {
            String lastReceiptSql = """
                SELECT receipt_no FROM receipt_entries 
                WHERE school_id = ? AND academic_year = ? 
                ORDER BY 
                    CASE 
                        WHEN receipt_no REGEXP '^In[0-9]+$' 
                        THEN CAST(SUBSTRING(receipt_no, 3) AS UNSIGNED)
                        ELSE CAST(receipt_no AS UNSIGNED)
                    END DESC 
                LIMIT 1
            """;

            String lastReceiptNo = null;
            try {
                lastReceiptNo = jdbc.queryForObject(lastReceiptSql, String.class, schoolId, academicYear);
            } catch (Exception e) {
                log.debug("No previous receipts found, starting from In0001");
            }

            int nextNumber;
            if (lastReceiptNo != null && lastReceiptNo.startsWith("In")) {
                String numericPart = lastReceiptNo.substring(2);
                try {
                    nextNumber = Integer.parseInt(numericPart);
                } catch (NumberFormatException e) {
                    log.warn("Invalid receipt number format: {}, starting from 1", lastReceiptNo);
                    nextNumber = 0;
                }
                nextNumber++;

                if (nextNumber > 5000) {
                    nextNumber = 1;
                }
            } else {
                nextNumber = 1;
            }

            return "In" + String.format("%04d", nextNumber);

        } catch (Exception e) {
            log.error("Error generating receipt number: {}", e.getMessage());
            Integer count = getReceiptCount(schoolId, academicYear);
            int nextNumber = (count % 5000) + 1;
            return "In" + String.format("%04d", nextNumber);
        }
    }

    public String getLastReceiptNo(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        try {
            String sql = """
                SELECT receipt_no 
                FROM receipt_entries 
                WHERE school_id = ? AND academic_year = ? 
                ORDER BY 
                    CASE 
                        WHEN receipt_no REGEXP '^In[0-9]+$' 
                        THEN CAST(SUBSTRING(receipt_no, 3) AS UNSIGNED)
                        ELSE CAST(receipt_no AS UNSIGNED)
                    END DESC 
                LIMIT 1
            """;
            String lastReceiptNo = jdbc.queryForObject(sql, String.class, schoolId, academicYear);
            return lastReceiptNo != null ? lastReceiptNo : "In0000";
        } catch (Exception e) {
            log.warn("Error getting last receipt number, returning In0000", e);
            return "In0000";
        }
    }

    public Integer getReceiptCount(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        try {
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM receipt_entries WHERE school_id = ? AND academic_year = ?",
                    Integer.class,
                    schoolId, academicYear
            );
            return count != null ? count : 0;
        } catch (Exception e) {
            log.warn("Error getting receipt count, returning 0", e);
            return 0;
        }
    }

    private String getSubHeadForMainHead(JdbcTemplate jdbc, String mainHead, String schoolId, String academicYear) {
        try {
            String sql = """
                SELECT sub_head_name 
                FROM receipt_subheads 
                WHERE main_head_name = ? 
                    AND school_id = ? 
                    AND academic_year = ?
                LIMIT 1
            """;

            return jdbc.queryForObject(sql, String.class, mainHead, schoolId, academicYear);
        } catch (Exception e) {
            log.warn("No sub head found for main head: {}, using default", mainHead);
            return "General";
        }
    }

    @Transactional
    public ReceiptEntry saveReceipt(String schoolId, ReceiptEntryDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        if (dto.getCategory() == null || dto.getCategory().trim().isEmpty()) {
            throw new RuntimeException("Category (Main Head) is required");
        }

        String accountHead = getSubHeadForMainHead(jdbc, dto.getCategory(), schoolId, dto.getAcademicYear());
        log.info("Selected main head: {}, Auto-selected sub head: {}", dto.getCategory(), accountHead);

        String receiptNo;
        if (dto.getReceiptNo() != null && !dto.getReceiptNo().trim().isEmpty()) {
            receiptNo = dto.getReceiptNo().trim();
            if (!receiptNo.toUpperCase().startsWith("IN")) {
                try {
                    String numericPart = receiptNo.replaceAll("[^0-9]", "");
                    if (!numericPart.isEmpty()) {
                        int num = Integer.parseInt(numericPart);
                        receiptNo = "In" + String.format("%04d", num);
                    } else {
                        receiptNo = generateReceiptNo(schoolId, dto.getAcademicYear());
                    }
                } catch (NumberFormatException e) {
                    receiptNo = generateReceiptNo(schoolId, dto.getAcademicYear());
                }
            }
        } else {
            receiptNo = generateReceiptNo(schoolId, dto.getAcademicYear());
        }

        String checkSql = "SELECT COUNT(*) FROM receipt_entries WHERE receipt_no = ? AND school_id = ? AND academic_year = ?";
        Integer existingCount = jdbc.queryForObject(checkSql, Integer.class, receiptNo, schoolId, dto.getAcademicYear());
        if (existingCount != null && existingCount > 0) {
            receiptNo = generateReceiptNo(schoolId, dto.getAcademicYear());
        }

        LocalDate receiptDate;
        try {
            receiptDate = LocalDate.parse(dto.getDate(), dateFormatter);
        } catch (Exception e) {
            receiptDate = LocalDate.now();
            log.warn("Invalid date format, using current date");
        }

        // REMOVED transaction_id
        String insertReceiptSQL = """
            INSERT INTO receipt_entries 
            (receipt_no, date, category, account_head, person_name, description, 
             receipt_mode, reference_id, amount, school_id, academic_year) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        int rows = jdbc.update(insertReceiptSQL,
                receiptNo,
                receiptDate.toString(),
                dto.getCategory(),
                accountHead,
                dto.getPersonName(),
                dto.getDescription(),
                dto.getReceiptMode(),
                dto.getReferenceId(),
                dto.getAmount(),
                schoolId,
                dto.getAcademicYear()
        );

        if (rows == 0) {
            throw new RuntimeException("Failed to insert receipt entry");
        }

        insertDayBookEntry(jdbc, schoolId, dto.getAcademicYear(), receiptNo, receiptDate, dto, dto.getCategory());

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        // Removed transaction_id from builder
        return ReceiptEntry.builder()
                .id(lastId)
                .receiptNo(receiptNo)
                .date(receiptDate.toString())
                .category(dto.getCategory())
                .account_head(accountHead)
                .personName(dto.getPersonName())
                .description(dto.getDescription())
                .receiptMode(dto.getReceiptMode())
                .referenceId(dto.getReferenceId())
                .amount(dto.getAmount())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .createdAt(LocalDateTime.now())
                .build();
    }

    private void insertDayBookEntry(JdbcTemplate jdbc, String schoolId, String academicYear,
                                    String receiptNo, LocalDate receiptDate, ReceiptEntryDTO dto, String ledgerName) {

        String operatorName = "System Operator";

        String insertDayBookSQL = """
            INSERT INTO day_book (
                br_number, admission_number, name, br_date, description, 
                ledger, credit, debit, mode, operator_name, 
                school_id, academic_year
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try {
            // FIX: Using atTime(LocalTime.now()) ensures the Date is correct (31st) and includes current time
            java.sql.Timestamp dbTimeStamp = java.sql.Timestamp.valueOf(receiptDate.atTime(java.time.LocalTime.now()));

            jdbc.update(insertDayBookSQL,
                    receiptNo,
                    "N/A",
                    dto.getPersonName(),
                    dbTimeStamp, // Date + Current Time
                    dto.getDescription(),
                    ledgerName,
                    dto.getAmount(),
                    0.00,
                    dto.getReceiptMode(),
                    operatorName,
                    schoolId,
                    academicYear
            );

            log.info("✅ Day book entry created for receipt: {}, Ledger (MainHead): {}", receiptNo, ledgerName);
        } catch (Exception e) {
            log.error("❌ Failed to create day book entry: {}", e.getMessage());
            throw new RuntimeException("Failed to create accounting entry: " + e.getMessage(), e);
        }
    }

    public ReceiptEntry searchByReceiptNo(String schoolId, String academicYear, String receiptNo) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        try {
            log.info("Searching for receipt: {} in school: {}, academic year: {}",
                    receiptNo, schoolId, academicYear);

            String formattedReceiptNo = receiptNo.trim();
            if (!formattedReceiptNo.toUpperCase().startsWith("IN")) {
                String numericPart = formattedReceiptNo.replaceAll("[^0-9]", "");
                if (!numericPart.isEmpty()) {
                    try {
                        int num = Integer.parseInt(numericPart);
                        formattedReceiptNo = "In" + String.format("%04d", num);
                    } catch (NumberFormatException e) {
                        // Keep as is
                    }
                }
            }

            String sql = "SELECT * FROM receipt_entries WHERE school_id = ? AND academic_year = ? AND receipt_no = ?";

            ReceiptEntry receipt = jdbc.queryForObject(
                    sql,
                    new BeanPropertyRowMapper<>(ReceiptEntry.class),
                    schoolId, academicYear, formattedReceiptNo
            );

            if (receipt != null) {
                log.info("Found receipt: {}", receipt.getReceiptNo());
            }

            return receipt;
        } catch (Exception e) {
            log.warn("No receipt entry found for receiptNo: {} in school: {}. Error: {}",
                    receiptNo, schoolId, e.getMessage());
            return null;
        }
    }

    public Map<String, Object> getReceiptHistory(String schoolId, String academicYear, String receiptNo) {
        Map<String, Object> result = new HashMap<>();
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        try {
            String formattedReceiptNo = receiptNo.trim();
            if (!formattedReceiptNo.toUpperCase().startsWith("IN")) {
                formattedReceiptNo = "In" + formattedReceiptNo.replaceAll("[^0-9]", "");
            }

            String sql = "SELECT * FROM receipt_entries WHERE school_id = ? AND academic_year = ? AND receipt_no = ?";

            ReceiptEntry receipt = jdbc.queryForObject(
                    sql,
                    new BeanPropertyRowMapper<>(ReceiptEntry.class),
                    schoolId, academicYear, formattedReceiptNo
            );

            if (receipt != null) {
                result.put("receipt", receipt);

                String dayBookSql = """
                    SELECT * FROM day_book 
                    WHERE school_id = ? AND academic_year = ? AND br_number = ?
                """;

                try {
                    Map<String, Object> dayBookEntry = jdbc.queryForMap(
                            dayBookSql,
                            schoolId, academicYear, formattedReceiptNo
                    );
                    result.put("dayBookEntry", dayBookEntry);
                } catch (Exception e) {
                    log.debug("No day book entry found for receipt: {}", formattedReceiptNo);
                }
            }
        } catch (Exception e) {
            log.error("Error fetching receipt history: {}", e.getMessage());
        }

        return result;
    }

    public List<Map<String, Object>> getAllReceiptsWithDayBook(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        String sql = """
            SELECT 
                r.*,
                d.br_number as day_book_ref,
                d.br_date as day_book_date,
                d.credit as day_book_amount
            FROM receipt_entries r
            LEFT JOIN day_book d ON d.br_number = r.receipt_no
                AND d.school_id = r.school_id 
                AND d.academic_year = r.academic_year
            WHERE r.school_id = ? AND r.academic_year = ?
            ORDER BY 
                CASE 
                    WHEN r.receipt_no REGEXP '^In[0-9]+$' 
                    THEN CAST(SUBSTRING(r.receipt_no, 3) AS UNSIGNED)
                    ELSE CAST(r.receipt_no AS UNSIGNED)
                END DESC
        """;

        return jdbc.queryForList(sql, schoolId, academicYear);
    }

    @Transactional
    public boolean deleteReceipt(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        try {
            String getReceiptNoSql = "SELECT receipt_no FROM receipt_entries WHERE id = ? AND school_id = ?";
            String receiptNo = jdbc.queryForObject(getReceiptNoSql, String.class, id, schoolId);

            if (receiptNo != null) {
                String deleteDayBookSql = "DELETE FROM day_book WHERE br_number = ? AND school_id = ?";
                jdbc.update(deleteDayBookSql, receiptNo, schoolId);

                String deleteReceiptSql = "DELETE FROM receipt_entries WHERE id = ? AND school_id = ?";
                int rows = jdbc.update(deleteReceiptSql, id, schoolId);

                log.info("✅ Deleted receipt {} and day book entry {}", id, receiptNo);
                return rows > 0;
            }
        } catch (Exception e) {
            log.error("Error deleting receipt: {}", e.getMessage());
        }

        return false;
    }

    @Transactional
    public Optional<ReceiptEntry> updateReceipt(String schoolId, Long id, ReceiptEntryDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        ReceiptEntry existing = null;
        try {
            existing = jdbc.queryForObject(
                    "SELECT * FROM receipt_entries WHERE id = ? AND school_id = ?",
                    new BeanPropertyRowMapper<>(ReceiptEntry.class),
                    id, schoolId
            );
        } catch (Exception e) {
            log.error("Receipt entry not found: {}", e.getMessage());
            return Optional.empty();
        }

        if (existing == null) {
            return Optional.empty();
        }

        String accountHead = getSubHeadForMainHead(jdbc, dto.getCategory(), schoolId, dto.getAcademicYear());

        int rows = jdbc.update(
                """
                UPDATE receipt_entries 
                SET date = ?, category = ?, account_head = ?, person_name = ?, 
                    description = ?, receipt_mode = ?, reference_id = ?, amount = ?
                WHERE id = ? AND school_id = ?
                """,
                dto.getDate(), dto.getCategory(), accountHead, dto.getPersonName(),
                dto.getDescription(), dto.getReceiptMode(), dto.getReferenceId(), dto.getAmount(),
                id, schoolId
        );

        if (rows == 0) return Optional.empty();

        updateDayBookEntry(jdbc, schoolId, existing.getReceiptNo(), dto, dto.getCategory());

        return Optional.ofNullable(jdbc.queryForObject(
                "SELECT * FROM receipt_entries WHERE id = ?",
                new BeanPropertyRowMapper<>(ReceiptEntry.class),
                id
        ));
    }

    private void updateDayBookEntry(JdbcTemplate jdbc, String schoolId, String receiptNo, ReceiptEntryDTO dto, String ledgerName) {
        String updateDayBookSQL = """
            UPDATE day_book 
            SET name = ?, description = ?, ledger = ?, credit = ?, mode = ?
            WHERE br_number = ? AND school_id = ?
        """;

        try {
            jdbc.update(updateDayBookSQL,
                    dto.getPersonName(),
                    dto.getDescription(),
                    ledgerName,
                    dto.getAmount(),
                    dto.getReceiptMode(),
                    receiptNo,
                    schoolId
            );
            log.info("✅ Updated day book entry for {}", receiptNo);
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
                ledger as account_head,
                description,
                mode,
                credit,
                operator_name,
                created_at
            FROM day_book 
            WHERE school_id = ? AND academic_year = ? 
                AND br_number LIKE 'In%'  -- Receipt entries start with 'In'
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

    public List<String> getReceiptCategories(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        String sql = """
            SELECT DISTINCT category 
            FROM receipt_entries 
            WHERE school_id = ? AND academic_year = ? 
            ORDER BY category
        """;

        return jdbc.queryForList(sql, String.class, schoolId, academicYear);
    }

    public List<Map<String, Object>> getReceiptSummaryByCategory(String schoolId, String academicYear,
                                                                 String fromDate, String toDate) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        StringBuilder sql = new StringBuilder("""
            SELECT 
                category,
                account_head,
                COUNT(*) as receipt_count,
                SUM(amount) as total_amount
            FROM receipt_entries 
            WHERE school_id = ? AND academic_year = ? 
        """);

        List<Object> params = new ArrayList<>();
        params.add(schoolId);
        params.add(academicYear);

        if (fromDate != null && !fromDate.trim().isEmpty()) {
            sql.append(" AND date >= ?");
            params.add(fromDate);
        }

        if (toDate != null && !toDate.trim().isEmpty()) {
            sql.append(" AND date <= ?");
            params.add(toDate);
        }

        sql.append(" GROUP BY category, account_head ORDER BY total_amount DESC");

        return jdbc.queryForList(sql.toString(), params.toArray());
    }

    public List<String> getSubHeadsForMainHead(String schoolId, String academicYear, String mainHead) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        try {
            String sql = """
                SELECT sub_head_name 
                FROM receipt_subheads 
                WHERE main_head_name = ? 
                    AND school_id = ? 
                    AND academic_year = ?
                ORDER BY sub_head_name
            """;

            return jdbc.queryForList(sql, String.class, mainHead, schoolId, academicYear);
        } catch (Exception e) {
            log.warn("No sub heads found for main head: {}", mainHead);
            return new ArrayList<>();
        }
    }
}