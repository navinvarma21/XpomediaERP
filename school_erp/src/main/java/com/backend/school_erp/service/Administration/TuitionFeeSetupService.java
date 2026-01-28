package com.backend.school_erp.service.Administration;

import com.backend.school_erp.config.DatabaseConfig;
import lombok.extern.slf4j.Slf4j;
import com.backend.school_erp.DTO.Administration.TuitionFeeSetupDTO;
import com.backend.school_erp.entity.Administration.TuitionFeeSetup;
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
public class TuitionFeeSetupService {

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
            CREATE TABLE IF NOT EXISTS tuition_fees (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                standard VARCHAR(100) NOT NULL,
                student_category VARCHAR(100) NOT NULL,
                fee_heading VARCHAR(100) NOT NULL,
                account_head VARCHAR(100) NOT NULL, -- Added account_head
                fee_amount DECIMAL(12,2) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_fee (standard, student_category, fee_heading, school_id, academic_year)
            )
        """);
    }

    // --- CRUD Methods ---
    public List<TuitionFeeSetup> getTuitionFees(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM tuition_fees WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(TuitionFeeSetup.class),
                schoolId, academicYear
        );
    }

    public TuitionFeeSetup addTuitionFee(String schoolId, TuitionFeeSetupDTO dto, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // Validate that account_head is provided
        if (dto.getAccountHead() == null || dto.getAccountHead().trim().isEmpty()) {
            throw new RuntimeException("Account head is required.");
        }

        try {
            jdbc.update(
                    "INSERT INTO tuition_fees (standard, student_category, fee_heading, account_head, fee_amount, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    dto.getStandard(), dto.getStudentCategory(), dto.getFeeHeading(),
                    dto.getAccountHead(), dto.getFeeAmount(), schoolId, academicYear
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Tuition fee already exists for this combination.");
        }
        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return jdbc.queryForObject(
                "SELECT * FROM tuition_fees WHERE id = ?",
                new BeanPropertyRowMapper<>(TuitionFeeSetup.class),
                lastId
        );
    }

    public TuitionFeeSetup updateTuitionFee(String schoolId, Long id, TuitionFeeSetupDTO dto, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // Validate that account_head is provided
        if (dto.getAccountHead() == null || dto.getAccountHead().trim().isEmpty()) {
            throw new RuntimeException("Account head is required.");
        }

        int rows = jdbc.update(
                "UPDATE tuition_fees SET standard=?, student_category=?, fee_heading=?, account_head=?, fee_amount=? WHERE id=? AND school_id=? AND academic_year=?",
                dto.getStandard(), dto.getStudentCategory(), dto.getFeeHeading(),
                dto.getAccountHead(), dto.getFeeAmount(), id, schoolId, academicYear
        );
        if (rows == 0) throw new RuntimeException("Tuition fee not found with id " + id);
        return jdbc.queryForObject(
                "SELECT * FROM tuition_fees WHERE id = ?",
                new BeanPropertyRowMapper<>(TuitionFeeSetup.class),
                id
        );
    }

    public void deleteTuitionFee(String schoolId, Long id, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        int rows = jdbc.update(
                "DELETE FROM tuition_fees WHERE id = ? AND school_id = ? AND academic_year = ?",
                id, schoolId, academicYear
        );
        if (rows == 0) throw new RuntimeException("Tuition fee not found with id " + id);
    }

    // --- Dropdown Methods ---

    public List<Map<String, Object>> getCourses(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        // Added WHERE clause to filter by schoolId and academicYear
        return jdbc.queryForList(
                "SELECT id AS value, standard AS label FROM courses WHERE school_id = ? AND academic_year = ? ORDER BY standard",
                schoolId, academicYear
        );
    }

    public List<Map<String, Object>> getStudentCategories(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        // Added WHERE clause to filter by schoolId and academicYear
        return jdbc.queryForList(
                "SELECT id AS value, student_category_name AS label FROM student_categories WHERE school_id = ? AND academic_year = ? ORDER BY student_category_name",
                schoolId, academicYear
        );
    }

    public List<Map<String, Object>> getFeeHeadings(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        // Include account_head in the response
        return jdbc.queryForList(
                "SELECT id AS value, fee_head AS label, account_head FROM fee_heads WHERE school_id = ? AND academic_year = ? ORDER BY fee_head",
                schoolId, academicYear
        );
    }
}