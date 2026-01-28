package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.CategoryHeadDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Store.CategoryHead;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class CategoryHeadService {
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
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                category_name VARCHAR(100) NOT NULL,
                account_head VARCHAR(100),
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_category (category_name, school_id, academic_year)
            )
        """);
    }

    public List<CategoryHead> getCategoryHeads(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM categories WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(CategoryHead.class),
                schoolId, academicYear
        );
    }

    public CategoryHead addCategoryHead(String schoolId, CategoryHeadDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            jdbc.update(
                    "INSERT INTO categories (category_name, account_head, school_id, academic_year) VALUES (?, ?, ?, ?)",
                    dto.getCategoryName(), dto.getAccountHead(), schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Category already exists for name: " + dto.getCategoryName());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return CategoryHead.builder()
                .id(lastId)
                .categoryName(dto.getCategoryName())
                .accountHead(dto.getAccountHead())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public CategoryHead updateCategoryHead(String schoolId, Long id, CategoryHeadDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update(
                "UPDATE categories SET category_name = ?, account_head = ? WHERE id = ?",
                dto.getCategoryName(), dto.getAccountHead(), id
        );
        if (rows == 0) throw new RuntimeException("Category not found with id " + id);

        return jdbc.queryForObject(
                "SELECT * FROM categories WHERE id = ?",
                new BeanPropertyRowMapper<>(CategoryHead.class),
                id
        );
    }

    public void deleteCategoryHead(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM categories WHERE id = ?", id);
        if (rows == 0) throw new RuntimeException("Category not found with id " + id);
    }
}