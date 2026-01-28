package com.backend.school_erp.service.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.ArrearFeeDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.AdmissionMaster.ArrearFee;
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
public class ArrearFeeService {

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
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS arrear_fees (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    admission_number VARCHAR(50) NOT NULL,
                    student_name VARCHAR(255) NOT NULL,
                    standard VARCHAR(50) NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    fee_head VARCHAR(255) NOT NULL,
                    in_out VARCHAR(10) NOT NULL,
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    account_head VARCHAR(255), -- NEW: Added account_head column
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_admission_number (admission_number),
                    INDEX idx_school_academic (school_id, academic_year),
                    INDEX idx_fee_head (fee_head),
                    INDEX idx_account_head (account_head) -- NEW: Added index for account_head
                )
            """);

            // Check if account_head column exists, if not add it
            try {
                jdbc.execute("ALTER TABLE arrear_fees ADD COLUMN IF NOT EXISTS account_head VARCHAR(255)");
                log.info("account_head column added or already exists in arrear_fees table");
            } catch (Exception e) {
                log.warn("account_head column may already exist: {}", e.getMessage());
            }
        } catch (Exception e) {
            log.error("Failed to create/update arrear_fees table: {}", e.getMessage());
            throw new RuntimeException("Database table creation/update failed", e);
        }
    }

    public List<ArrearFee> getArrearFeesBySchool(String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            String sql;
            Object[] params;

            if (academicYear != null && !academicYear.trim().isEmpty()) {
                sql = "SELECT * FROM arrear_fees WHERE school_id = ? AND academic_year = ? ORDER BY created_at DESC";
                params = new Object[]{schoolId, academicYear};
            } else {
                sql = "SELECT * FROM arrear_fees WHERE school_id = ? ORDER BY created_at DESC";
                params = new Object[]{schoolId};
            }

            List<ArrearFee> arrearFees = jdbc.query(
                    sql,
                    new BeanPropertyRowMapper<>(ArrearFee.class),
                    params
            );
            log.info("Found {} arrear fees for school: {}", arrearFees.size(), schoolId);
            return arrearFees;
        } catch (Exception e) {
            log.error("Error fetching arrear fees for school {}: {}", schoolId, e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<ArrearFee> getArrearFeesByAdmissionNumber(String schoolId, String admissionNumber, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            String sql;
            Object[] params;

            if (academicYear != null && !academicYear.trim().isEmpty()) {
                sql = "SELECT * FROM arrear_fees WHERE school_id = ? AND admission_number = ? AND academic_year = ? ORDER BY created_at DESC";
                params = new Object[]{schoolId, admissionNumber, academicYear};
            } else {
                sql = "SELECT * FROM arrear_fees WHERE school_id = ? AND admission_number = ? ORDER BY created_at DESC";
                params = new Object[]{schoolId, admissionNumber};
            }

            List<ArrearFee> arrearFees = jdbc.query(
                    sql,
                    new BeanPropertyRowMapper<>(ArrearFee.class),
                    params
            );
            log.info("Found {} arrear fees for admission number: {}", arrearFees.size(), admissionNumber);
            return arrearFees;
        } catch (Exception e) {
            log.error("Error fetching arrear fees for admission number {}: {}", admissionNumber, e.getMessage());
            return new ArrayList<>();
        }
    }

    public ArrearFee addArrearFee(String schoolId, ArrearFeeDTO dto) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            // Validate required fields
            if (dto.getAdmissionNumber() == null || dto.getAdmissionNumber().trim().isEmpty()) {
                throw new RuntimeException("Admission number is required");
            }
            if (dto.getAmount() == null || dto.getAmount() <= 0) {
                throw new RuntimeException("Valid amount is required");
            }
            if (dto.getFeeHead() == null || dto.getFeeHead().trim().isEmpty()) {
                throw new RuntimeException("Fee head is required");
            }

            // Set default values for optional fields
            String studentName = dto.getStudentName() != null ? dto.getStudentName() : "";
            String standard = dto.getStandard() != null ? dto.getStandard() : "";
            String inOut = dto.getInOut() != null ? dto.getInOut() : "IN";
            String academicYear = dto.getAcademicYear() != null ? dto.getAcademicYear() : "";
            String accountHead = dto.getAccountHead() != null ? dto.getAccountHead() : "";

            int rows = jdbc.update(
                    "INSERT INTO arrear_fees (admission_number, student_name, standard, amount, fee_head, in_out, school_id, academic_year, account_head) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    dto.getAdmissionNumber(),
                    studentName,
                    standard,
                    dto.getAmount(),
                    dto.getFeeHead(),
                    inOut,
                    schoolId,
                    academicYear,
                    accountHead
            );

            if (rows == 0) {
                throw new RuntimeException("Failed to insert arrear fee");
            }

            Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

            return ArrearFee.builder()
                    .id(lastId)
                    .admissionNumber(dto.getAdmissionNumber())
                    .studentName(studentName)
                    .standard(standard)
                    .amount(dto.getAmount())
                    .feeHead(dto.getFeeHead())
                    .inOut(inOut)
                    .schoolId(schoolId)
                    .academicYear(academicYear)
                    .accountHead(accountHead)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Error adding arrear fee: {}", e.getMessage());
            throw new RuntimeException("Failed to add arrear fee: " + e.getMessage(), e);
        }
    }

    public Optional<ArrearFee> updateArrearFee(String schoolId, Long id, ArrearFeeDTO dto) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            // Validate required fields
            if (dto.getAdmissionNumber() == null || dto.getAdmissionNumber().trim().isEmpty()) {
                throw new RuntimeException("Admission number is required");
            }
            if (dto.getAmount() == null || dto.getAmount() <= 0) {
                throw new RuntimeException("Valid amount is required");
            }
            if (dto.getFeeHead() == null || dto.getFeeHead().trim().isEmpty()) {
                throw new RuntimeException("Fee head is required");
            }

            // Set default values for optional fields
            String studentName = dto.getStudentName() != null ? dto.getStudentName() : "";
            String standard = dto.getStandard() != null ? dto.getStandard() : "";
            String inOut = dto.getInOut() != null ? dto.getInOut() : "IN";
            String academicYear = dto.getAcademicYear() != null ? dto.getAcademicYear() : "";
            String accountHead = dto.getAccountHead() != null ? dto.getAccountHead() : "";

            int rows = jdbc.update(
                    "UPDATE arrear_fees SET admission_number = ?, student_name = ?, standard = ?, amount = ?, fee_head = ?, in_out = ?, academic_year = ?, account_head = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND school_id = ?",
                    dto.getAdmissionNumber(),
                    studentName,
                    standard,
                    dto.getAmount(),
                    dto.getFeeHead(),
                    inOut,
                    academicYear,
                    accountHead,
                    id,
                    schoolId
            );

            if (rows == 0) {
                return Optional.empty();
            }

            ArrearFee updated = jdbc.queryForObject(
                    "SELECT * FROM arrear_fees WHERE id = ? AND school_id = ?",
                    new BeanPropertyRowMapper<>(ArrearFee.class),
                    id, schoolId
            );

            return Optional.ofNullable(updated);

        } catch (Exception e) {
            log.error("Error updating arrear fee ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to update arrear fee: " + e.getMessage(), e);
        }
    }

    public boolean deleteArrearFee(String schoolId, Long id) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            int rows = jdbc.update("DELETE FROM arrear_fees WHERE id = ? AND school_id = ?", id, schoolId);
            boolean deleted = rows > 0;
            log.info("Delete operation for arrear fee ID {}: {}", id, deleted ? "successful" : "not found");
            return deleted;
        } catch (Exception e) {
            log.error("Error deleting arrear fee ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to delete arrear fee: " + e.getMessage(), e);
        }
    }

    public Optional<ArrearFee> getArrearFeeById(String schoolId, Long id) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            ArrearFee arrearFee = jdbc.queryForObject(
                    "SELECT * FROM arrear_fees WHERE id = ? AND school_id = ?",
                    new BeanPropertyRowMapper<>(ArrearFee.class),
                    id, schoolId
            );

            return Optional.ofNullable(arrearFee);
        } catch (Exception e) {
            log.error("Error fetching arrear fee by ID {}: {}", id, e.getMessage());
            return Optional.empty();
        }
    }
}