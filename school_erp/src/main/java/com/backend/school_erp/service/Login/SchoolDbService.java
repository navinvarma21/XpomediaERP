package com.backend.school_erp.service.Login;

// 1. Import the Centralized Config
import com.backend.school_erp.config.DatabaseConfig;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SchoolDbService {

    // Cache for each school's JdbcTemplate
    private final Map<String, JdbcTemplate> jdbcTemplateCache = new ConcurrentHashMap<>();

    // Get or create a pooled JdbcTemplate for the school DB
    private JdbcTemplate getSchoolJdbcTemplate(String schoolId) {
        return jdbcTemplateCache.computeIfAbsent(schoolId, id -> {
            HikariDataSource ds = new HikariDataSource();

            // 2. Using centralized AWS DB Connection constants
            // Note: DatabaseConfig.DB_PARAMS includes the '?' and SSL/Timezone settings
            ds.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            ds.setUsername(DatabaseConfig.AWS_DB_USER);
            ds.setPassword(DatabaseConfig.AWS_DB_PASS);
            ds.setDriverClassName(DatabaseConfig.JDBC_DRIVER);

            // --- Pool tuning ---
            ds.setMaximumPoolSize(5); // max 5 connections per school
            ds.setMinimumIdle(1);
            ds.setIdleTimeout(30000);
            ds.setMaxLifetime(1800000);

            return new JdbcTemplate(ds);
        });
    }

    // Fetch academic years
    public List<String> getAcademicYears(String schoolId) {
        JdbcTemplate jdbc = getSchoolJdbcTemplate(schoolId);
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS academic_years (
                yearId INT AUTO_INCREMENT PRIMARY KEY,
                year VARCHAR(20) UNIQUE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """);
        return jdbc.queryForList("SELECT year FROM academic_years ORDER BY year DESC", String.class);
    }

    // Add year if not exists
    public void addAcademicYearIfNotExists(String schoolId, String year) {
        JdbcTemplate jdbc = getSchoolJdbcTemplate(schoolId);
        jdbc.update("INSERT IGNORE INTO academic_years (year) VALUES (?)", year);
    }
}