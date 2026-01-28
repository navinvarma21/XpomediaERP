package com.backend.school_erp.service.Transport;

import com.backend.school_erp.DTO.Transport.BusBillEntryDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Transport.BusBillEntry;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class BusBillEntryService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            config.setMaximumPoolSize(10);
            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private void ensureTableExists(JdbcTemplate jdbc) {
        try {
            // Ensure Bus Table Exists
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS bus_bill_entries (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    bus_bill_number VARCHAR(100) NOT NULL UNIQUE,
                    admission_number VARCHAR(50) NOT NULL,
                    student_name VARCHAR(255) NOT NULL,
                    father_name VARCHAR(255),
                    standard VARCHAR(50),
                    section VARCHAR(50),
                    boarding_point VARCHAR(255),
                    bus_bill_date TIMESTAMP NOT NULL,
                    original_bus_amount DECIMAL(10,2) DEFAULT 0,
                    bus_paid_amount DECIMAL(10,2) DEFAULT 0,
                    remaining_balance DECIMAL(10,2) DEFAULT 0,
                    payment_mode VARCHAR(50) NOT NULL,
                    payment_number VARCHAR(100),
                    operator_name VARCHAR(255) NOT NULL,
                    transaction_narrative TEXT,
                    transaction_date TIMESTAMP,
                    route_number VARCHAR(100),
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    bus_fee_payments_json JSON,
                    total_bus_paid_amount DECIMAL(10,2) DEFAULT 0,
                    total_bus_concession_amount DECIMAL(10,2) DEFAULT 0,
                    student_id BIGINT,
                    bus_fee_amount DECIMAL(10,2) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_bus_bill_number (bus_bill_number),
                    INDEX idx_admission_number (admission_number)
                )
            """);

            // Ensure Billing Table Exists (for sync)
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS billing_entries (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    bill_number VARCHAR(100) NOT NULL UNIQUE,
                    admission_number VARCHAR(50) NOT NULL,
                    student_name VARCHAR(255) NOT NULL,
                    father_name VARCHAR(255),
                    standard VARCHAR(50),
                    section VARCHAR(50),
                    boarding_point VARCHAR(255),
                    bill_date TIMESTAMP NOT NULL,
                    remaining_balance DECIMAL(10,2) DEFAULT 0,
                    paid_amount DECIMAL(10,2) DEFAULT 0,
                    payment_mode VARCHAR(50) NOT NULL,
                    payment_number VARCHAR(100),
                    operator_name VARCHAR(255) NOT NULL,
                    transaction_narrative TEXT,
                    transaction_date TIMESTAMP,
                    route_number VARCHAR(100),
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    fee_payments_json JSON,
                    total_paid_amount DECIMAL(10,2) DEFAULT 0,
                    total_concession_amount DECIMAL(10,2) DEFAULT 0,
                    student_id BIGINT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """);
        } catch (Exception e) {
            throw new RuntimeException("Database table creation failed", e);
        }
    }

    @Transactional
    public BusBillEntry processBusPayment(String schoolId, BusBillEntryDTO dto) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            double totalBusPaidAmount = 0.0;
            double totalBusConcessionAmount = 0.0;
            if (dto.getBusFeePayments() != null) {
                for (Map<String, Object> payment : dto.getBusFeePayments()) {
                    totalBusPaidAmount += Double.parseDouble(payment.get("paidAmount").toString());
                    totalBusConcessionAmount += Double.parseDouble(payment.get("concessionAmount").toString());
                }
            }

            String busFeePaymentsJson = objectMapper.writeValueAsString(dto.getBusFeePayments());
            Double remainingBalance = dto.getRemainingBalance();

            // 1. Insert into BUS BILL TABLE
            int rowsBus = jdbc.update(
                    "INSERT INTO bus_bill_entries (bus_bill_number, admission_number, student_name, father_name, standard, section, boarding_point, bus_bill_date, original_bus_amount, bus_paid_amount, remaining_balance, payment_mode, payment_number, operator_name, transaction_narrative, transaction_date, route_number, school_id, academic_year, bus_fee_payments_json, total_bus_paid_amount, total_bus_concession_amount, student_id, bus_fee_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    dto.getBusBillNumber(), dto.getAdmissionNumber(), dto.getStudentName(), dto.getFatherName(), dto.getStandard(), dto.getSection(), dto.getBoardingPoint(),
                    dto.getBusBillDate() != null ? dto.getBusBillDate() : LocalDateTime.now(),
                    dto.getOriginalBusAmount(), totalBusPaidAmount, remainingBalance, dto.getPaymentMode(), dto.getPaymentNumber(), dto.getOperatorName(), dto.getTransactionNarrative(), dto.getTransactionDate(),
                    dto.getRouteNumber(), schoolId, dto.getAcademicYear(), busFeePaymentsJson, totalBusPaidAmount, totalBusConcessionAmount, dto.getStudentId(), dto.getBusFeeAmount()
            );

            // 2. Sync to BILLING ENTRY TABLE
            jdbc.update(
                    "INSERT INTO billing_entries (bill_number, admission_number, student_name, father_name, standard, section, boarding_point, bill_date, remaining_balance, paid_amount, payment_mode, payment_number, operator_name, transaction_narrative, transaction_date, route_number, school_id, academic_year, fee_payments_json, total_paid_amount, total_concession_amount, student_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    dto.getBusBillNumber(),
                    dto.getAdmissionNumber(), dto.getStudentName(), dto.getFatherName(), dto.getStandard(), dto.getSection(), dto.getBoardingPoint(),
                    dto.getBusBillDate() != null ? dto.getBusBillDate() : LocalDateTime.now(),
                    remainingBalance,
                    totalBusPaidAmount, dto.getPaymentMode(), dto.getPaymentNumber(), dto.getOperatorName(), dto.getTransactionNarrative(), dto.getTransactionDate(), dto.getRouteNumber(),
                    schoolId, dto.getAcademicYear(),
                    busFeePaymentsJson,
                    totalBusPaidAmount, totalBusConcessionAmount, dto.getStudentId()
            );

            Long busBillEntryId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            return jdbc.queryForObject("SELECT * FROM bus_bill_entries WHERE id = ?", new BeanPropertyRowMapper<>(BusBillEntry.class), busBillEntryId);

        } catch (Exception e) {
            throw new RuntimeException("Failed to process bus payment", e);
        }
    }

    // --- GETTERS AND HELPERS (Added back to fix your error) ---

    private String getBusFeeDetailsFromJson(String busFeePaymentsJson) {
        try {
            if (busFeePaymentsJson == null || busFeePaymentsJson.trim().isEmpty()) return "No bus fee details";
            List<Map<String, Object>> busFeePayments = objectMapper.readValue(busFeePaymentsJson, objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            StringBuilder details = new StringBuilder();
            for (Map<String, Object> busFeePayment : busFeePayments) {
                String feeHead = (String) busFeePayment.get("feeHead");
                Object paidAmount = busFeePayment.get("paidAmount");
                if (feeHead != null && paidAmount != null) {
                    if (details.length() > 0) details.append(", ");
                    details.append(feeHead).append(" (₹").append(paidAmount).append(")");
                }
            }
            return details.length() > 0 ? details.toString() : "Bus fee details unavailable";
        } catch (Exception e) {
            return "Bus fee details unavailable";
        }
    }

    public List<Map<String, Object>> getBusPaymentHistory(String schoolId, String admissionNumber) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);
            // Fetch from bus_bill_entries table
            List<Map<String, Object>> history = jdbc.queryForList("SELECT * FROM bus_bill_entries WHERE school_id = ? AND admission_number = ? ORDER BY bus_bill_date DESC", schoolId, admissionNumber);

            history.forEach(entry -> {
                entry.put("reference_no", entry.get("payment_number") != null ? entry.get("payment_number") : "N/A");
                entry.put("bus_fee_details", getBusFeeDetailsFromJson((String) entry.get("bus_fee_payments_json")));
            });
            return history;
        } catch (Exception e) { return new ArrayList<>(); }
    }

    public Map<String, String> getLastBusBillNumber(String schoolId) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);
            String last = jdbc.queryForObject("SELECT bus_bill_number FROM bus_bill_entries WHERE school_id = ? ORDER BY id DESC LIMIT 1", String.class, schoolId);
            return Map.of("lastBusBillNumber", last != null ? last : "");
        } catch (Exception e) { return Map.of("lastBusBillNumber", ""); }
    }

    // Re-added Missing Methods
    public List<BusBillEntry> getBusBillEntriesBySchool(String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);
            String sql = (academicYear != null)
                    ? "SELECT * FROM bus_bill_entries WHERE school_id = ? AND academic_year = ? ORDER BY bus_bill_date DESC"
                    : "SELECT * FROM bus_bill_entries WHERE school_id = ? ORDER BY bus_bill_date DESC";
            Object[] params = (academicYear != null) ? new Object[]{schoolId, academicYear} : new Object[]{schoolId};
            return jdbc.query(sql, new BeanPropertyRowMapper<>(BusBillEntry.class), params);
        } catch (Exception e) { return new ArrayList<>(); }
    }

    public List<BusBillEntry> getBusBillEntriesByAdmissionNumber(String schoolId, String admissionNumber, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);
            String sql = (academicYear != null)
                    ? "SELECT * FROM bus_bill_entries WHERE school_id = ? AND admission_number = ? AND academic_year = ? ORDER BY bus_bill_date DESC"
                    : "SELECT * FROM bus_bill_entries WHERE school_id = ? AND admission_number = ? ORDER BY bus_bill_date DESC";
            Object[] params = (academicYear != null) ? new Object[]{schoolId, admissionNumber, academicYear} : new Object[]{schoolId, admissionNumber};
            return jdbc.query(sql, new BeanPropertyRowMapper<>(BusBillEntry.class), params);
        } catch (Exception e) { return new ArrayList<>(); }
    }

    public Optional<BusBillEntry> getBusBillEntryById(String schoolId, Long id) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);
            return Optional.ofNullable(jdbc.queryForObject("SELECT * FROM bus_bill_entries WHERE id = ? AND school_id = ?", new BeanPropertyRowMapper<>(BusBillEntry.class), id, schoolId));
        } catch (Exception e) { return Optional.empty(); }
    }

    public Optional<BusBillEntry> getBusBillEntryByBusBillNumber(String schoolId, String busBillNumber) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);
            return Optional.ofNullable(jdbc.queryForObject("SELECT * FROM bus_bill_entries WHERE bus_bill_number = ? AND school_id = ?", new BeanPropertyRowMapper<>(BusBillEntry.class), busBillNumber, schoolId));
        } catch (Exception e) { return Optional.empty(); }
    }

    public boolean deleteBusBillEntry(String schoolId, Long id) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            // Try to get bill number first to delete from main table too
            try {
                BusBillEntry entry = jdbc.queryForObject("SELECT * FROM bus_bill_entries WHERE id = ? AND school_id = ?", new BeanPropertyRowMapper<>(BusBillEntry.class), id, schoolId);
                if (entry != null) {
                    jdbc.update("DELETE FROM billing_entries WHERE bill_number = ? AND school_id = ?", entry.getBusBillNumber(), schoolId);
                }
            } catch (Exception ex) {
                // Ignore if fetch fails, just proceed to delete from bus table
            }

            return jdbc.update("DELETE FROM bus_bill_entries WHERE id = ? AND school_id = ?", id, schoolId) > 0;
        } catch (Exception e) { throw new RuntimeException("Delete failed", e); }
    }
}