package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.StaffDACDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.StaffDAC;
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
public class StaffDACService {

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
            CREATE TABLE IF NOT EXISTS staff_dac (
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

    public List<StaffDAC> getAll(String type, String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM staff_dac WHERE type = ? AND school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(StaffDAC.class),
                type, schoolId, academicYear
        );
    }

    public StaffDAC add(String schoolId, StaffDACDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("""
            INSERT INTO staff_dac (name, type, school_id, academic_year)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE id = id
        """, dto.getName(), dto.getType(), dto.getSchoolId(), dto.getAcademicYear());

        if (rows == 0) {
            throw new RuntimeException(dto.getType() + " already exists: " + dto.getName());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return StaffDAC.builder()
                .id(lastId)
                .name(dto.getName())
                .type(dto.getType())
                .schoolId(dto.getSchoolId())
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public Optional<StaffDAC> update(String schoolId, Long id, String newName) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("UPDATE staff_dac SET name = ? WHERE id = ?", newName, id);
        if (rows == 0) return Optional.empty();

        return Optional.ofNullable(jdbc.queryForObject(
                "SELECT * FROM staff_dac WHERE id = ?",
                new BeanPropertyRowMapper<>(StaffDAC.class),
                id
        ));
    }

    public boolean delete(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        int rows = jdbc.update("DELETE FROM staff_dac WHERE id = ?", id);
        return rows > 0;
    }
}
