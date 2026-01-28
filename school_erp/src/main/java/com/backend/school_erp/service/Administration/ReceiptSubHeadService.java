package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.ReceiptSubHeadDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.ReceiptSubHead;
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
public class ReceiptSubHeadService {

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
            CREATE TABLE IF NOT EXISTS receipt_sub_heads (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                main_head_name VARCHAR(100) NOT NULL,  -- Changed from main_head_id to main_head_name
                sub_head_name VARCHAR(100) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_receipt_sub_head (main_head_name, sub_head_name, school_id, academic_year)
                -- Removed foreign key constraint since we're storing name directly
            )
        """);
    }

    public List<ReceiptSubHead> getReceiptSubHeads(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String query = """
            SELECT 
                id, 
                main_head_name, 
                sub_head_name, 
                school_id, 
                academic_year, 
                created_at
            FROM receipt_sub_heads 
            WHERE school_id = ? AND academic_year = ? 
            ORDER BY id DESC
        """;

        return jdbc.query(
                query,
                new BeanPropertyRowMapper<>(ReceiptSubHead.class),
                schoolId, academicYear
        );
    }

    public ReceiptSubHead addReceiptSubHead(String schoolId, ReceiptSubHeadDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            jdbc.update(
                    "INSERT INTO receipt_sub_heads (main_head_name, sub_head_name, school_id, academic_year) VALUES (?, ?, ?, ?)",
                    dto.getMainHeadName(), dto.getSubHeadName(), schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Receipt Sub Head already exists under this main head: " + dto.getSubHeadName());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return getReceiptSubHeadById(jdbc, lastId);
    }

    public ReceiptSubHead updateReceiptSubHead(String schoolId, Long id, ReceiptSubHeadDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // Check if the new sub head name already exists under the same main head (excluding current record)
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM receipt_sub_heads WHERE main_head_name = ? AND sub_head_name = ? AND school_id = ? AND academic_year = ? AND id != ?",
                Integer.class,
                dto.getMainHeadName(), dto.getSubHeadName(), schoolId, dto.getAcademicYear(), id
        );

        if (count != null && count > 0) {
            throw new RuntimeException("Receipt Sub Head already exists under this main head: " + dto.getSubHeadName());
        }

        int rows = jdbc.update(
                "UPDATE receipt_sub_heads SET main_head_name = ?, sub_head_name = ? WHERE id = ? AND school_id = ? AND academic_year = ?",
                dto.getMainHeadName(), dto.getSubHeadName(), id, schoolId, dto.getAcademicYear()
        );
        if (rows == 0) throw new RuntimeException("Receipt Sub Head not found with id " + id);

        return getReceiptSubHeadById(jdbc, id);
    }

    public void deleteReceiptSubHead(String schoolId, Long id, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update(
                "DELETE FROM receipt_sub_heads WHERE id = ? AND school_id = ? AND academic_year = ?",
                id, schoolId, academicYear
        );
        if (rows == 0) throw new RuntimeException("Receipt Sub Head not found with id " + id);
    }

    // Helper method to fetch receipt sub head by ID
    private ReceiptSubHead getReceiptSubHeadById(JdbcTemplate jdbc, Long id) {
        String query = """
            SELECT 
                id, 
                main_head_name, 
                sub_head_name, 
                school_id, 
                academic_year, 
                created_at
            FROM receipt_sub_heads 
            WHERE id = ?
        """;

        return jdbc.queryForObject(
                query,
                new BeanPropertyRowMapper<>(ReceiptSubHead.class),
                id
        );
    }
}