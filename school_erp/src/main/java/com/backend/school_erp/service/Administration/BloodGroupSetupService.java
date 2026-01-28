package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.BloodGroupSetupDTO;
import com.backend.school_erp.entity.Administration.BloodGroupSetup;
import com.backend.school_erp.config.DatabaseConfig; // 1. Importing the config
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
public class BloodGroupSetupService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("Creating HikariCP DataSource for school: {} on AWS RDS", id);

            HikariConfig config = new HikariConfig();

            // 2. Using AWS DB Constants from DatabaseConfig
            // Appends the schoolId (database name) to the base AWS URL
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName(DatabaseConfig.JDBC_DRIVER);

            // Connection Pool Settings
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
                CREATE TABLE IF NOT EXISTS blood_groups (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    blood_group VARCHAR(50) NOT NULL,
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_blood_group (blood_group, school_id, academic_year)
                )
            """);
        } catch (Exception e) {
            log.error("Failed to create blood_groups table: {}", e.getMessage());
            throw new RuntimeException("Database table creation failed", e);
        }
    }

    public List<BloodGroupSetup> getBloodGroups(String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            List<BloodGroupSetup> bloodGroups = jdbc.query(
                    "SELECT * FROM blood_groups WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                    new BeanPropertyRowMapper<>(BloodGroupSetup.class),
                    schoolId, academicYear
            );
            log.info("Found {} blood groups for school: {}", bloodGroups.size(), schoolId);
            return bloodGroups;
        } catch (Exception e) {
            log.error("Error fetching blood groups for school {}: {}", schoolId, e.getMessage());
            return new ArrayList<>();
        }
    }

    public BloodGroupSetup addBloodGroup(String schoolId, BloodGroupSetupDTO dto) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            // Check if blood group already exists
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM blood_groups WHERE blood_group = ? AND school_id = ? AND academic_year = ?",
                    Integer.class,
                    dto.getBloodGroup(), schoolId, dto.getAcademicYear()
            );

            if (count != null && count > 0) {
                throw new RuntimeException("Blood group already exists: " + dto.getBloodGroup());
            }

            int rows = jdbc.update(
                    "INSERT INTO blood_groups (blood_group, school_id, academic_year) VALUES (?, ?, ?)",
                    dto.getBloodGroup(), schoolId, dto.getAcademicYear()
            );

            if (rows == 0) {
                throw new RuntimeException("Failed to insert blood group");
            }

            Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

            return BloodGroupSetup.builder()
                    .id(lastId)
                    .bloodGroup(dto.getBloodGroup())
                    .schoolId(schoolId)
                    .academicYear(dto.getAcademicYear())
                    .build();

        } catch (Exception e) {
            log.error("Error adding blood group: {}", e.getMessage());
            throw new RuntimeException("Failed to add blood group: " + e.getMessage(), e);
        }
    }

    public Optional<BloodGroupSetup> updateBloodGroup(String schoolId, Long id, BloodGroupSetupDTO dto) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            // Check if new name conflicts with existing blood group
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM blood_groups WHERE blood_group = ? AND school_id = ? AND academic_year = ? AND id != ?",
                    Integer.class,
                    dto.getBloodGroup(), schoolId, dto.getAcademicYear(), id
            );

            if (count != null && count > 0) {
                throw new RuntimeException("Blood group already exists: " + dto.getBloodGroup());
            }

            int rows = jdbc.update(
                    "UPDATE blood_groups SET blood_group = ?, academic_year = ? WHERE id = ? AND school_id = ?",
                    dto.getBloodGroup(), dto.getAcademicYear(), id, schoolId
            );

            if (rows == 0) {
                return Optional.empty();
            }

            BloodGroupSetup updated = jdbc.queryForObject(
                    "SELECT * FROM blood_groups WHERE id = ? AND school_id = ?",
                    new BeanPropertyRowMapper<>(BloodGroupSetup.class),
                    id, schoolId
            );

            return Optional.ofNullable(updated);

        } catch (Exception e) {
            log.error("Error updating blood group ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to update blood group: " + e.getMessage(), e);
        }
    }

    public boolean deleteBloodGroup(String schoolId, Long id) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            int rows = jdbc.update("DELETE FROM blood_groups WHERE id = ? AND school_id = ?", id, schoolId);
            boolean deleted = rows > 0;
            log.info("Delete operation for blood group ID {}: {}", id, deleted ? "successful" : "not found");
            return deleted;
        } catch (Exception e) {
            log.error("Error deleting blood group ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to delete blood group: " + e.getMessage(), e);
        }
    }
}