package com.backend.school_erp.service.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.SchoolDetailsDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.AdmissionMaster.SchoolDetails;
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
public class SchoolDetailsService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            try {
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
                config.setConnectionTestQuery("SELECT 1");
                return new HikariDataSource(config);
            } catch (Exception e) {
                log.error("❌ Failed to create DataSource for school: {}", id, e);
                throw new RuntimeException("Failed to create database connection for school: " + id, e);
            }
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        try {
            return new JdbcTemplate(getDataSource(schoolId));
        } catch (Exception e) {
            log.error("❌ Failed to get JdbcTemplate for school: {}", schoolId, e);
            throw new RuntimeException("Database connection failed for school: " + schoolId, e);
        }
    }

    private void ensureTableExists(JdbcTemplate jdbc) {
        try {
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS school_details (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    school_name VARCHAR(255) NOT NULL,
                    school_address TEXT NOT NULL,
                    city VARCHAR(100) NOT NULL,
                    state VARCHAR(100) NOT NULL,
                    pincode VARCHAR(10) NOT NULL,
                    email VARCHAR(255),
                    phone_number VARCHAR(15),
                    profile_image MEDIUMBLOB,
                    profile_image_type VARCHAR(50), -- Add this column
                    school_id VARCHAR(50) NOT NULL,
                    created_by VARCHAR(100) DEFAULT 'system',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_by VARCHAR(100) DEFAULT 'system',
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_school (school_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);
            log.info("✅ School details table ensured to exist");
        } catch (Exception e) {
            log.error("❌ Failed to create school_details table", e);
            throw new RuntimeException("Failed to create school_details table", e);
        }
    }

    public Optional<SchoolDetails> getSchoolDetails(String schoolId) {
        try {
            log.info("🔍 Fetching school details for school: {}", schoolId);
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            String sql = "SELECT id, school_name, school_address, city, state, pincode, " +
                    "email, phone_number, profile_image, profile_image_type, school_id, " + // Include profile_image_type
                    "created_by, created_at, updated_by, updated_at " +
                    "FROM school_details WHERE school_id = ?";

            List<SchoolDetails> schoolDetails = jdbc.query(
                    sql,
                    new BeanPropertyRowMapper<>(SchoolDetails.class),
                    schoolId
            );

            if (schoolDetails.isEmpty()) {
                log.info("📭 No school details found for school: {}", schoolId);
                return Optional.empty();
            } else {
                log.info("✅ Found school details for school: {}", schoolId);
                return Optional.of(schoolDetails.get(0));
            }
        } catch (Exception e) {
            log.error("❌ Error fetching school details for school: {}", schoolId, e);
            return Optional.empty();
        }
    }

    public SchoolDetails saveSchoolDetails(String schoolId, SchoolDetailsDTO dto, String username) {
        log.info("💾 Saving school details for school: {}", schoolId);

        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            // Validate input
            validateSchoolDetails(dto);

            Optional<SchoolDetails> existingDetails = getSchoolDetails(schoolId);
            LocalDateTime now = LocalDateTime.now();

            if (existingDetails.isPresent()) {
                log.info("🔄 Updating existing school details for school: {}", schoolId);
                // Update existing record
                int rows = jdbc.update("""
                    UPDATE school_details 
                    SET school_name = ?, school_address = ?, city = ?, state = ?, pincode = ?, 
                        email = ?, phone_number = ?, profile_image = ?, profile_image_type = ?,
                        updated_by = ?, updated_at = ?
                    WHERE school_id = ?
                """,
                        dto.getSchoolName(), dto.getSchoolAddress(), dto.getCity(),
                        dto.getState(), dto.getPincode(), dto.getEmail(),
                        dto.getPhoneNumber(), dto.getProfileImage(), dto.getProfileImageType(),
                        username, now, schoolId
                );

                if (rows > 0) {
                    log.info("✅ School details updated successfully for school: {}", schoolId);
                    return getSchoolDetails(schoolId)
                            .orElseThrow(() -> new RuntimeException("Failed to retrieve updated school details"));
                } else {
                    throw new RuntimeException("No records were updated - school details may not exist");
                }
            } else {
                log.info("🆕 Creating new school details for school: {}", schoolId);
                // Insert new record
                int rows = jdbc.update("""
                    INSERT INTO school_details 
                    (school_name, school_address, city, state, pincode, email, phone_number, profile_image, profile_image_type, school_id, created_by, updated_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                        dto.getSchoolName(), dto.getSchoolAddress(), dto.getCity(),
                        dto.getState(), dto.getPincode(), dto.getEmail(),
                        dto.getPhoneNumber(), dto.getProfileImage(), dto.getProfileImageType(),
                        schoolId, username, username
                );

                if (rows > 0) {
                    Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
                    log.info("✅ School details created successfully with ID: {} for school: {}", lastId, schoolId);

                    return SchoolDetails.builder()
                            .id(lastId)
                            .schoolName(dto.getSchoolName())
                            .schoolAddress(dto.getSchoolAddress())
                            .city(dto.getCity())
                            .state(dto.getState())
                            .pincode(dto.getPincode())
                            .email(dto.getEmail())
                            .phoneNumber(dto.getPhoneNumber())
                            .profileImage(dto.getProfileImage())
                            .profileImageType(dto.getProfileImageType()) // Set image type
                            .schoolId(schoolId)
                            .createdBy(username)
                            .updatedBy(username)
                            .createdAt(now.toString())
                            .updatedAt(now.toString())
                            .build();
                } else {
                    throw new RuntimeException("Failed to insert school details - no rows affected");
                }
            }
        } catch (Exception e) {
            log.error("❌ Error saving school details for school: {}", schoolId, e);
            throw new RuntimeException("Failed to save school details: " + e.getMessage(), e);
        }
    }

    public boolean deleteSchoolDetails(String schoolId) {
        try {
            log.info("🗑️ Deleting school details for school: {}", schoolId);
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            int rows = jdbc.update("DELETE FROM school_details WHERE school_id = ?", schoolId);
            boolean deleted = rows > 0;

            if (deleted) {
                log.info("✅ School details deleted successfully for school: {}", schoolId);
            } else {
                log.info("📭 No school details found to delete for school: {}", schoolId);
            }

            return deleted;
        } catch (Exception e) {
            log.error("❌ Error deleting school details for school: {}", schoolId, e);
            return false;
        }
    }

    public void validateSchoolDetails(SchoolDetailsDTO dto) {
        if (dto.getSchoolName() == null || dto.getSchoolName().trim().isEmpty()) {
            throw new IllegalArgumentException("School name is required");
        }
        if (dto.getSchoolAddress() == null || dto.getSchoolAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("School address is required");
        }
        if (dto.getCity() == null || dto.getCity().trim().isEmpty()) {
            throw new IllegalArgumentException("City is required");
        }
        if (dto.getState() == null || dto.getState().trim().isEmpty()) {
            throw new IllegalArgumentException("State is required");
        }
        if (dto.getPincode() == null || !dto.getPincode().matches("\\d{6}")) {
            throw new IllegalArgumentException("Pincode must be exactly 6 digits");
        }
        if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
            if (!dto.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                throw new IllegalArgumentException("Invalid email format");
            }
        }
        if (dto.getPhoneNumber() != null && !dto.getPhoneNumber().trim().isEmpty()) {
            if (!dto.getPhoneNumber().matches("\\d{10}")) {
                throw new IllegalArgumentException("Phone number must be exactly 10 digits");
            }
        }

        // Additional validation
        if (dto.getSchoolName().length() > 255) {
            throw new IllegalArgumentException("School name must be less than 255 characters");
        }
        if (dto.getPincode().length() != 6) {
            throw new IllegalArgumentException("Pincode must be exactly 6 digits");
        }
        if (dto.getEmail() != null && dto.getEmail().length() > 255) {
            throw new IllegalArgumentException("Email must be less than 255 characters");
        }
        if (dto.getPhoneNumber() != null && dto.getPhoneNumber().length() > 15) {
            throw new IllegalArgumentException("Phone number must be less than 15 characters");
        }

        // Validate image type if image is provided
        if (dto.getProfileImage() != null && dto.getProfileImageType() == null) {
            throw new IllegalArgumentException("Profile image type is required when profile image is provided");
        }
    }
}