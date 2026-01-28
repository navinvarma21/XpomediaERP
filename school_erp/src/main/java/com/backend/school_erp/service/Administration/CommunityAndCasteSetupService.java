package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.CommunityAndCasteSetupDTO;
import com.backend.school_erp.entity.Administration.CommunityAndCasteSetup;
import com.backend.school_erp.config.DatabaseConfig; // Imported Config
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
public class CommunityAndCasteSetupService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("Creating HikariCP DataSource for school: {} on AWS RDS", id);
            HikariConfig config = new HikariConfig();

            // Using AWS DB Constants from DatabaseConfig
            // The URL is constructed as: base_url + schoolId + params
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName(DatabaseConfig.JDBC_DRIVER);

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
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS community_caste (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_entry (name, type, school_id, academic_year)
            )
        """);
    }

    public List<CommunityAndCasteSetup> getAll(String schoolId, String academicYear, String type) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM community_caste WHERE school_id=? AND academic_year=? AND type=? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(CommunityAndCasteSetup.class),
                schoolId, academicYear, type
        );
    }

    public CommunityAndCasteSetup add(CommunityAndCasteSetupDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(dto.getSchoolId());
        ensureTableExists(jdbc);

        int rows = jdbc.update(
                "INSERT IGNORE INTO community_caste (name, type, school_id, academic_year) VALUES (?, ?, ?, ?)",
                dto.getName(), dto.getType(), dto.getSchoolId(), dto.getAcademicYear()
        );
        if (rows == 0) {
            throw new RuntimeException(dto.getType() + " entry already exists: " + dto.getName());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return CommunityAndCasteSetup.builder()
                .id(lastId)
                .name(dto.getName())
                .type(dto.getType())
                .schoolId(dto.getSchoolId())
                .academicYear(dto.getAcademicYear())
                .createdAt(LocalDateTime.now())
                .build();
    }

    public Optional<CommunityAndCasteSetup> update(String schoolId, Long id, String newName) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("UPDATE community_caste SET name=? WHERE id=?", newName, id);
        if (rows == 0) return Optional.empty();

        return Optional.ofNullable(jdbc.queryForObject(
                "SELECT * FROM community_caste WHERE id=?",
                new BeanPropertyRowMapper<>(CommunityAndCasteSetup.class),
                id
        ));
    }

    public boolean delete(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.update("DELETE FROM community_caste WHERE id=?", id) > 0;
    }

    public void ensureTenant(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
    }
}