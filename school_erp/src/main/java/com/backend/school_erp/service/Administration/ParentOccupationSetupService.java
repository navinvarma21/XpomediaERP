package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.ParentOccupationSetupDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.ParentOccupationSetup;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class ParentOccupationSetupService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

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

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private void ensureTableExists(JdbcTemplate jdbc) {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS parent_occupations (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                occupation VARCHAR(100) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_occupation (occupation, school_id, academic_year)
            )
        """);
    }

    public List<ParentOccupationSetup> getAll(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM parent_occupations WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(ParentOccupationSetup.class),
                schoolId, academicYear
        );
    }

    public ParentOccupationSetup addOccupation(String schoolId, ParentOccupationSetupDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            jdbc.update(
                    "INSERT INTO parent_occupations (occupation, school_id, academic_year) VALUES (?, ?, ?)",
                    dto.getOccupation(), schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Parent Occupation already exists: " + dto.getOccupation());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return ParentOccupationSetup.builder()
                .id(lastId)
                .occupation(dto.getOccupation())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public ParentOccupationSetup updateOccupation(String schoolId, Long id, String newOccupation) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("UPDATE parent_occupations SET occupation = ? WHERE id = ?", newOccupation, id);
        if (rows == 0) throw new RuntimeException("Parent Occupation not found with id " + id);

        return jdbc.queryForObject(
                "SELECT * FROM parent_occupations WHERE id = ?",
                new BeanPropertyRowMapper<>(ParentOccupationSetup.class),
                id
        );
    }

    public void deleteOccupation(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM parent_occupations WHERE id = ?", id);
        if (rows == 0) throw new RuntimeException("Parent Occupation not found with id " + id);
    }
}
