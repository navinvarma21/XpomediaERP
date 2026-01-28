package com.backend.school_erp.service.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.IndividualFeeDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.AdmissionMaster.IndividualFee;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class IndividualFeeService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("Creating HikariCP DataSource for school: {}", id);
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");

            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);
            config.setMaxLifetime(1800000);
            config.setConnectionTimeout(10000);

            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private void ensureTableExists(JdbcTemplate jdbc) {
        try {
            // Updated Table Structure: Added account_head, Removed student_id
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS individual_fees (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    admission_number VARCHAR(50) NOT NULL,
                    student_name VARCHAR(255) NOT NULL,
                    fee_head VARCHAR(255) NOT NULL,
                    account_head VARCHAR(255),
                    amount DECIMAL(10,2) NOT NULL,
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_admission_number (admission_number),
                    INDEX idx_school_academic (school_id, academic_year),
                    INDEX idx_fee_head (fee_head)
                )
            """);
        } catch (Exception e) {
            log.error("Failed to create individual_fees table: {}", e.getMessage());
            throw new RuntimeException("Database table creation failed", e);
        }
    }

    public List<IndividualFee> getIndividualFeesBySchool(String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            String sql;
            Object[] params;

            if (academicYear != null && !academicYear.trim().isEmpty()) {
                sql = "SELECT * FROM individual_fees WHERE school_id = ? AND academic_year = ? ORDER BY admission_number, fee_head";
                params = new Object[]{schoolId, academicYear};
            } else {
                sql = "SELECT * FROM individual_fees WHERE school_id = ? ORDER BY admission_number, fee_head";
                params = new Object[]{schoolId};
            }

            List<IndividualFee> individualFees = jdbc.query(
                    sql,
                    new BeanPropertyRowMapper<>(IndividualFee.class),
                    params
            );
            return individualFees;
        } catch (Exception e) {
            log.error("Error fetching individual fees for school {}: {}", schoolId, e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<IndividualFee> getIndividualFeesByAdmissionNumber(String schoolId, String admissionNumber, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            String sql;
            Object[] params;

            if (academicYear != null && !academicYear.trim().isEmpty()) {
                sql = "SELECT * FROM individual_fees WHERE school_id = ? AND admission_number = ? AND academic_year = ? ORDER BY fee_head";
                params = new Object[]{schoolId, admissionNumber, academicYear};
            } else {
                sql = "SELECT * FROM individual_fees WHERE school_id = ? AND admission_number = ? ORDER BY fee_head";
                params = new Object[]{schoolId, admissionNumber};
            }

            List<IndividualFee> individualFees = jdbc.query(
                    sql,
                    new BeanPropertyRowMapper<>(IndividualFee.class),
                    params
            );
            return individualFees;
        } catch (Exception e) {
            log.error("Error fetching individual fees for admission number {}: {}", admissionNumber, e.getMessage());
            return new ArrayList<>();
        }
    }

    public IndividualFee addIndividualFee(String schoolId, IndividualFeeDTO dto) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            if (dto.getAdmissionNumber() == null || dto.getAdmissionNumber().trim().isEmpty()) throw new RuntimeException("Admission number is required");
            if (dto.getFeeHead() == null || dto.getFeeHead().trim().isEmpty()) throw new RuntimeException("Fee head is required");
            if (dto.getAmount() == null || dto.getAmount() <= 0) throw new RuntimeException("Valid amount is required");

            String studentName = dto.getStudentName() != null ? dto.getStudentName() : "";
            String academicYear = dto.getAcademicYear() != null ? dto.getAcademicYear() : "";
            String accountHead = dto.getAccountHead() != null ? dto.getAccountHead() : "";

            // Removed student_id, added account_head
            int rows = jdbc.update(
                    "INSERT INTO individual_fees (admission_number, student_name, fee_head, account_head, amount, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    dto.getAdmissionNumber(),
                    studentName,
                    dto.getFeeHead(),
                    accountHead,
                    dto.getAmount(),
                    schoolId,
                    academicYear
            );

            if (rows == 0) throw new RuntimeException("Failed to insert individual fee");

            Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

            return IndividualFee.builder()
                    .id(lastId)
                    .admissionNumber(dto.getAdmissionNumber())
                    .studentName(studentName)
                    .feeHead(dto.getFeeHead())
                    .accountHead(accountHead)
                    .amount(dto.getAmount())
                    .schoolId(schoolId)
                    .academicYear(academicYear)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Error adding individual fee: {}", e.getMessage());
            throw new RuntimeException("Failed to add individual fee: " + e.getMessage(), e);
        }
    }

    public Optional<IndividualFee> updateIndividualFee(String schoolId, Long id, IndividualFeeDTO dto) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            if (dto.getAdmissionNumber() == null || dto.getAdmissionNumber().trim().isEmpty()) throw new RuntimeException("Admission number is required");
            if (dto.getFeeHead() == null || dto.getFeeHead().trim().isEmpty()) throw new RuntimeException("Fee head is required");
            if (dto.getAmount() == null || dto.getAmount() <= 0) throw new RuntimeException("Valid amount is required");

            String studentName = dto.getStudentName() != null ? dto.getStudentName() : "";
            String academicYear = dto.getAcademicYear() != null ? dto.getAcademicYear() : "";
            String accountHead = dto.getAccountHead() != null ? dto.getAccountHead() : "";

            // Removed student_id, added account_head
            int rows = jdbc.update(
                    "UPDATE individual_fees SET admission_number = ?, student_name = ?, fee_head = ?, account_head = ?, amount = ?, academic_year = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND school_id = ?",
                    dto.getAdmissionNumber(),
                    studentName,
                    dto.getFeeHead(),
                    accountHead,
                    dto.getAmount(),
                    academicYear,
                    id,
                    schoolId
            );

            if (rows == 0) return Optional.empty();

            IndividualFee updated = jdbc.queryForObject(
                    "SELECT * FROM individual_fees WHERE id = ? AND school_id = ?",
                    new BeanPropertyRowMapper<>(IndividualFee.class),
                    id, schoolId
            );

            return Optional.ofNullable(updated);

        } catch (Exception e) {
            log.error("Error updating individual fee ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to update individual fee: " + e.getMessage(), e);
        }
    }

    public boolean deleteIndividualFee(String schoolId, Long id) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);
            int rows = jdbc.update("DELETE FROM individual_fees WHERE id = ? AND school_id = ?", id, schoolId);
            return rows > 0;
        } catch (Exception e) {
            log.error("Error deleting individual fee ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to delete individual fee: " + e.getMessage(), e);
        }
    }
}