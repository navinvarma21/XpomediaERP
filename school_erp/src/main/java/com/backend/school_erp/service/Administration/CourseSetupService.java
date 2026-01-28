package com.backend.school_erp.service.Administration;

// 1. Imported the centralized configuration
import com.backend.school_erp.config.DatabaseConfig;

import com.backend.school_erp.DTO.Administration.CourseSetupDTO;
import com.backend.school_erp.entity.Administration.CourseSetup;
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
public class CourseSetupService {

    /** Cache of DataSources per school */
    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    /** Get pooled DataSource for a school (creates if missing) */
    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating HikariCP DataSource for school: {}", id);

            HikariConfig config = new HikariConfig();

            // 1. Using centralized AWS DB Connection constants
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName(DatabaseConfig.JDBC_DRIVER);

            // --- Pool tuning (safe defaults) ---
            config.setMaximumPoolSize(10);    // max 10 connections per school
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);     // 30 sec
            config.setMaxLifetime(1800000);   // 30 min
            config.setConnectionTimeout(10000); // 10 sec wait before timeout

            return new HikariDataSource(config);
        });
    }

    /** Get JdbcTemplate for a school */
    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    /** Ensure table exists */
    private void ensureTableExists(JdbcTemplate jdbc) {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS courses (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                standard VARCHAR(50) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_course (standard, school_id, academic_year)
            )
        """);
    }

    /** Get all courses */
    public List<CourseSetup> getCourses(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM courses WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(CourseSetup.class),
                schoolId, academicYear
        );
    }

    /** Add course */
    public CourseSetup addCourse(String schoolId, CourseSetupDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update(
                "INSERT IGNORE INTO courses (standard, school_id, academic_year) VALUES (?, ?, ?)",
                dto.getStandard(), schoolId, dto.getAcademicYear()
        );

        if (rows == 0) {
            throw new RuntimeException("Course already exists: " + dto.getStandard());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return CourseSetup.builder()
                .id(lastId)
                .standard(dto.getStandard())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    /** Update course */
    public Optional<CourseSetup> updateCourse(String schoolId, Long id, String standard) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("UPDATE courses SET standard = ? WHERE id = ?", standard, id);
        if (rows == 0) return Optional.empty();

        return Optional.ofNullable(jdbc.queryForObject(
                "SELECT * FROM courses WHERE id = ?",
                new BeanPropertyRowMapper<>(CourseSetup.class),
                id
        ));
    }

    /** Delete course */
    public boolean deleteCourse(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM courses WHERE id = ?", id);
        return rows > 0;
    }
}