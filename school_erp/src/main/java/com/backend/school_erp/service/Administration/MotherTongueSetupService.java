package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.MotherTongueSetupDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.MotherTongueSetup;
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
public class MotherTongueSetupService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    /** Get pooled DataSource for a school */
    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("Creating HikariCP DataSource for school: {}", id);
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");

            // Pool tuning
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

    /** Ensure mother_tongues table exists */
    private void ensureTableExists(JdbcTemplate jdbc) {
        try {
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS mother_tongues (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    mother_tongue VARCHAR(50) NOT NULL,
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_mother_tongue (mother_tongue, school_id, academic_year)
                )
            """);
        } catch (Exception e) {
            log.error("Failed to create mother_tongues table: {}", e.getMessage());
            throw new RuntimeException("Database table creation failed", e);
        }
    }

    /** Get all mother tongues */
    public List<MotherTongueSetup> getMotherTongues(String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            return jdbc.query(
                    "SELECT * FROM mother_tongues WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                    new BeanPropertyRowMapper<>(MotherTongueSetup.class),
                    schoolId, academicYear
            );
        } catch (Exception e) {
            log.error("Error fetching mother tongues for school {}: {}", schoolId, e.getMessage());
            return new ArrayList<>();
        }
    }

    /** Add mother tongue */
    public MotherTongueSetup addMotherTongue(String schoolId, MotherTongueSetupDTO dto) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            // Check duplicate
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM mother_tongues WHERE mother_tongue = ? AND school_id = ? AND academic_year = ?",
                    Integer.class,
                    dto.getMotherTongue(), schoolId, dto.getAcademicYear()
            );

            if (count != null && count > 0) {
                throw new RuntimeException("Mother tongue already exists: " + dto.getMotherTongue());
            }

            int rows = jdbc.update(
                    "INSERT INTO mother_tongues (mother_tongue, school_id, academic_year) VALUES (?, ?, ?)",
                    dto.getMotherTongue(), schoolId, dto.getAcademicYear()
            );

            if (rows == 0) {
                throw new RuntimeException("Failed to insert mother tongue");
            }

            Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

            return MotherTongueSetup.builder()
                    .id(lastId)
                    .motherTongue(dto.getMotherTongue())
                    .schoolId(schoolId)
                    .academicYear(dto.getAcademicYear())
                    .build();

        } catch (Exception e) {
            log.error("Error adding mother tongue: {}", e.getMessage());
            throw new RuntimeException("Failed to add mother tongue: " + e.getMessage(), e);
        }
    }

    /** Update mother tongue */
    public Optional<MotherTongueSetup> updateMotherTongue(String schoolId, Long id, MotherTongueSetupDTO dto) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            // Check duplicate (excluding current ID)
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM mother_tongues WHERE mother_tongue = ? AND school_id = ? AND academic_year = ? AND id != ?",
                    Integer.class,
                    dto.getMotherTongue(), schoolId, dto.getAcademicYear(), id
            );

            if (count != null && count > 0) {
                throw new RuntimeException("Mother tongue already exists: " + dto.getMotherTongue());
            }

            int rows = jdbc.update(
                    "UPDATE mother_tongues SET mother_tongue = ?, academic_year = ? WHERE id = ? AND school_id = ?",
                    dto.getMotherTongue(), dto.getAcademicYear(), id, schoolId
            );

            if (rows == 0) {
                return Optional.empty();
            }

            MotherTongueSetup updated = jdbc.queryForObject(
                    "SELECT * FROM mother_tongues WHERE id = ? AND school_id = ?",
                    new BeanPropertyRowMapper<>(MotherTongueSetup.class),
                    id, schoolId
            );

            return Optional.ofNullable(updated);

        } catch (Exception e) {
            log.error("Error updating mother tongue {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to update mother tongue: " + e.getMessage(), e);
        }
    }

    /** Delete mother tongue */
    public boolean deleteMotherTongue(String schoolId, Long id) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            int rows = jdbc.update("DELETE FROM mother_tongues WHERE id = ? AND school_id = ?", id, schoolId);
            boolean deleted = rows > 0;
            log.info("Delete operation for mother tongue ID {}: {}", id, deleted ? "successful" : "not found");
            return deleted;
        } catch (Exception e) {
            log.error("Error deleting mother tongue ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to delete mother tongue: " + e.getMessage(), e);
        }
    }
}
