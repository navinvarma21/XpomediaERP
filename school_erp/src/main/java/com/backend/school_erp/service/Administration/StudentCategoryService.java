package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.StudentCategoryDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.StudentCategory;
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
public class StudentCategoryService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    // ---------------- Hikari DataSource per school ----------------
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

    // ---------------- Ensure Table Exists ----------------
    private void ensureTableExists(JdbcTemplate jdbc) {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS student_categories (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                student_category_name VARCHAR(255) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_category (student_category_name, school_id, academic_year)
            )
        """);
    }

    // ---------------- Get Categories ----------------
    public List<StudentCategory> getCategories(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM student_categories WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(StudentCategory.class),
                schoolId, academicYear
        );
    }

    // ---------------- Add Category ----------------
    public StudentCategory addCategory(String schoolId, StudentCategoryDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            jdbc.update(
                    "INSERT INTO student_categories (student_category_name, school_id, academic_year) VALUES (?, ?, ?)",
                    dto.getStudentCategoryName(), schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Student Category already exists: " + dto.getStudentCategoryName());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return StudentCategory.builder()
                .id(lastId)
                .studentCategoryName(dto.getStudentCategoryName())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    // ---------------- Update Category ----------------
    public StudentCategory updateCategory(String schoolId, Long id, String newName) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update(
                "UPDATE student_categories SET student_category_name = ? WHERE id = ? AND school_id = ?",
                newName, id, schoolId
        );
        if (rows == 0) throw new RuntimeException("Student Category not found with id " + id);

        return jdbc.queryForObject(
                "SELECT * FROM student_categories WHERE id = ? AND school_id = ?",
                new BeanPropertyRowMapper<>(StudentCategory.class),
                id, schoolId
        );
    }

    // ---------------- Delete Category ----------------
    public void deleteCategory(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM student_categories WHERE id = ? AND school_id = ?", id, schoolId);
        if (rows == 0) throw new RuntimeException("Student Category not found with id " + id);
    }
}
