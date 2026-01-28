package com.backend.school_erp.service.Transaction;

import com.backend.school_erp.DTO.Transaction.StaffResponseDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Transaction.StaffUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class StaffPhoneService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    /** Get pooled DataSource for a school */
    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating HikariCP DataSource for school: {}", id);
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

    /** Get JdbcTemplate for a school */
    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    /** Get staff list for dropdown */
    public List<StaffResponseDTO> getStaffList(String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            String sql = """
                SELECT 
                    staff_code as staffCode,
                    name,
                    designation,
                    category,
                    mobile_number as mobileNumber,
                    status
                FROM staff 
                WHERE school_id = ? 
                AND academic_year = ? 
                AND status = 'active'
                ORDER BY name
                """;

            return jdbc.query(sql,
                    new BeanPropertyRowMapper<>(StaffResponseDTO.class),
                    schoolId, academicYear);

        } catch (Exception e) {
            log.error("Error fetching staff list for school: {}, academicYear: {}", schoolId, academicYear, e);
            throw new RuntimeException("Failed to fetch staff list: " + e.getMessage());
        }
    }

    /** Update staff phone number */
    public boolean updateStaffPhone(String schoolId, String academicYear, String staffCode, String newPhoneNumber, String updatedBy) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            // Validate staff exists and is active
            String validateSql = "SELECT COUNT(*) FROM staff WHERE school_id = ? AND academic_year = ? AND staff_code = ? AND status = 'active'";
            Integer count = jdbc.queryForObject(validateSql, Integer.class, schoolId, academicYear, staffCode);

            if (count == null || count == 0) {
                throw new RuntimeException("Staff member not found or inactive");
            }

            // Validate phone number format
            if (!newPhoneNumber.matches("^[0-9]{10}$")) {
                throw new RuntimeException("Invalid phone number format. Must be 10 digits.");
            }

            // Check if phone number already exists for another staff
            String duplicateSql = "SELECT COUNT(*) FROM staff WHERE school_id = ? AND academic_year = ? AND mobile_number = ? AND staff_code != ? AND status = 'active'";
            Integer duplicateCount = jdbc.queryForObject(duplicateSql, Integer.class, schoolId, academicYear, newPhoneNumber, staffCode);

            if (duplicateCount != null && duplicateCount > 0) {
                throw new RuntimeException("Phone number already exists for another staff member");
            }

            // Update phone number
            String updateSql = "UPDATE staff SET mobile_number = ? WHERE school_id = ? AND academic_year = ? AND staff_code = ?";
            int rowsAffected = jdbc.update(updateSql, newPhoneNumber, schoolId, academicYear, staffCode);

            if (rowsAffected > 0) {
                log.info("Successfully updated phone number for staff: {} in school: {}", staffCode, schoolId);

                // Log the update (optional - create an audit table if needed)
                logAudit(schoolId, academicYear, staffCode, newPhoneNumber, updatedBy);
                return true;
            }

            return false;

        } catch (Exception e) {
            log.error("Error updating staff phone for school: {}, staff: {}", schoolId, staffCode, e);
            throw new RuntimeException("Failed to update phone number: " + e.getMessage());
        }
    }

    /** Get staff details by staff code */
    public Optional<StaffResponseDTO> getStaffByCode(String schoolId, String academicYear, String staffCode) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            String sql = """
                SELECT 
                    staff_code as staffCode,
                    name,
                    designation,
                    category,
                    mobile_number as mobileNumber,
                    status
                FROM staff 
                WHERE school_id = ? 
                AND academic_year = ? 
                AND staff_code = ?
                AND status = 'active'
                """;

            List<StaffResponseDTO> staffList = jdbc.query(sql,
                    new BeanPropertyRowMapper<>(StaffResponseDTO.class),
                    schoolId, academicYear, staffCode);

            return staffList.isEmpty() ? Optional.empty() : Optional.of(staffList.get(0));

        } catch (Exception e) {
            log.error("Error fetching staff by code: {} for school: {}", staffCode, schoolId, e);
            return Optional.empty();
        }
    }

    /** Search staff by code or name */
    public List<StaffResponseDTO> searchStaff(String schoolId, String academicYear, String searchTerm) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            String sql = """
                SELECT 
                    staff_code as staffCode,
                    name,
                    designation,
                    category,
                    mobile_number as mobileNumber,
                    status
                FROM staff 
                WHERE school_id = ? 
                AND academic_year = ? 
                AND status = 'active'
                AND (staff_code LIKE ? OR name LIKE ?)
                ORDER BY name
                LIMIT 50
                """;

            String likeTerm = "%" + searchTerm + "%";
            return jdbc.query(sql,
                    new BeanPropertyRowMapper<>(StaffResponseDTO.class),
                    schoolId, academicYear, likeTerm, likeTerm);

        } catch (Exception e) {
            log.error("Error searching staff for term: {} in school: {}", searchTerm, schoolId, e);
            return Collections.emptyList();
        }
    }

    /** Log audit trail for phone updates */
    private void logAudit(String schoolId, String academicYear, String staffCode, String newPhoneNumber, String updatedBy) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            // Create audit table if not exists
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS staff_phone_audit (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    staff_code VARCHAR(100) NOT NULL,
                    old_phone_number VARCHAR(20),
                    new_phone_number VARCHAR(20) NOT NULL,
                    updated_by VARCHAR(100) NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    INDEX idx_staff_code (staff_code),
                    INDEX idx_updated_at (updated_at)
                )
                """);

            // Get old phone number for audit
            String oldPhoneSql = "SELECT mobile_number FROM staff WHERE school_id = ? AND academic_year = ? AND staff_code = ?";
            String oldPhoneNumber = jdbc.queryForObject(oldPhoneSql, String.class, schoolId, academicYear, staffCode);

            // Insert audit record
            jdbc.update(
                    "INSERT INTO staff_phone_audit (staff_code, old_phone_number, new_phone_number, updated_by, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?)",
                    staffCode, oldPhoneNumber, newPhoneNumber, updatedBy, schoolId, academicYear
            );

        } catch (Exception e) {
            log.warn("Failed to log audit trail for staff phone update: {}", e.getMessage());
        }
    }
}