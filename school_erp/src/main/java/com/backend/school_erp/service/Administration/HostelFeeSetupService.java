package com.backend.school_erp.service.Administration;

import com.backend.school_erp.config.DatabaseConfig;
import lombok.extern.slf4j.Slf4j;
import com.backend.school_erp.DTO.Administration.HostelFeeSetupDTO;
import com.backend.school_erp.entity.Administration.HostelFeeSetup;
import org.springframework.dao.DataAccessException;
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
public class HostelFeeSetupService {

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
        // IDs removed, account_head added, UNIQUE KEY updated to use names
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS hostel_fees (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                standard VARCHAR(100) NOT NULL,
                student_category VARCHAR(100) NOT NULL,
                fee_heading VARCHAR(100) NOT NULL,
                account_head VARCHAR(255),
                fee_amount DECIMAL(12,2) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_fee (standard, student_category, fee_heading, school_id, academic_year)
            )
        """);
    }

    public List<HostelFeeSetup> getHostelFees(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM hostel_fees WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(HostelFeeSetup.class),
                schoolId, academicYear
        );
    }

    public HostelFeeSetup addHostelFee(String schoolId, HostelFeeSetupDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        try {
            // IDs removed from INSERT, account_head added
            jdbc.update(
                    "INSERT INTO hostel_fees (standard, student_category, fee_heading, account_head, fee_amount, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    dto.getStandard(), dto.getStudentCategory(),
                    dto.getFeeHeading(), dto.getAccountHead(),
                    dto.getFeeAmount(), schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Hostel fee already exists for this combination.");
        }
        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return jdbc.queryForObject(
                "SELECT * FROM hostel_fees WHERE id = ?",
                new BeanPropertyRowMapper<>(HostelFeeSetup.class),
                lastId
        );
    }

    public HostelFeeSetup updateHostelFee(String schoolId, Long id, HostelFeeSetupDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        try {
            // UPDATED: Now allows updating Standard, Category, Heading, AccountHead, and Amount
            int rows = jdbc.update(
                    "UPDATE hostel_fees SET standard = ?, student_category = ?, fee_heading = ?, account_head = ?, fee_amount = ? WHERE id = ? AND school_id = ? AND academic_year = ?",
                    dto.getStandard(), dto.getStudentCategory(),
                    dto.getFeeHeading(), dto.getAccountHead(),
                    dto.getFeeAmount(), id, schoolId, dto.getAcademicYear()
            );
            if (rows == 0) throw new RuntimeException("Hostel fee not found with id " + id);

            return jdbc.queryForObject(
                    "SELECT * FROM hostel_fees WHERE id = ?",
                    new BeanPropertyRowMapper<>(HostelFeeSetup.class),
                    id
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Cannot update: A fee with this Standard, Category, and Fee Heading already exists.");
        }
    }

    public void deleteHostelFee(String schoolId, Long id, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        int rows = jdbc.update(
                "DELETE FROM hostel_fees WHERE id = ? AND school_id = ? AND academic_year = ?",
                id, schoolId, academicYear
        );
        if (rows == 0) throw new RuntimeException("Hostel fee not found with id " + id);
    }

    // --- Dropdown Methods with Safety Fallback ---

    public List<Map<String, Object>> getCourses(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        try {
            // Try fetching with academic year filter
            return jdbc.queryForList(
                    "SELECT id, standard AS name FROM courses WHERE academic_year = ? ORDER BY standard",
                    academicYear
            );
        } catch (DataAccessException e) {
            log.warn("⚠️ Column 'academic_year' likely missing in 'courses' table. Fetching all courses. Error: {}", e.getMessage());
            // Fallback: Fetch all if column is missing
            return jdbc.queryForList("SELECT id, standard AS name FROM courses ORDER BY standard");
        }
    }

    public List<Map<String, Object>> getStudentCategories(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        try {
            // Try fetching with academic year filter
            return jdbc.queryForList(
                    "SELECT id, student_category_name AS name FROM student_categories WHERE academic_year = ? ORDER BY student_category_name",
                    academicYear
            );
        } catch (DataAccessException e) {
            log.warn("⚠️ Column 'academic_year' likely missing in 'student_categories' table. Fetching all categories. Error: {}", e.getMessage());
            // Fallback: Fetch all if column is missing
            return jdbc.queryForList("SELECT id, student_category_name AS name FROM student_categories ORDER BY student_category_name");
        }
    }

    public List<Map<String, Object>> getFeeHeadings(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        try {
            // Try fetching with academic year filter
            return jdbc.queryForList(
                    "SELECT id, fee_head AS name, account_head FROM hostel_fee_heads WHERE academic_year = ? ORDER BY fee_head",
                    academicYear
            );
        } catch (DataAccessException e) {
            log.warn("⚠️ Column 'academic_year' likely missing in 'hostel_fee_heads' table. Fetching all fee heads. Error: {}", e.getMessage());
            // Fallback: Fetch all if column is missing
            return jdbc.queryForList("SELECT id, fee_head AS name, account_head FROM hostel_fee_heads ORDER BY fee_head");
        }
    }
}