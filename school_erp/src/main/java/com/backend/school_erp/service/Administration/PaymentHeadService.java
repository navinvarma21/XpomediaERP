package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.PaymentHeadDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.PaymentHead;
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
public class PaymentHeadService {

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
            CREATE TABLE IF NOT EXISTS payment_heads (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_payment_head (name, school_id, academic_year)
            )
        """);
    }

    public List<PaymentHead> getPaymentHeads(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM payment_heads WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(PaymentHead.class),
                schoolId, academicYear
        );
    }

    public PaymentHead addPaymentHead(String schoolId, PaymentHeadDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            jdbc.update(
                    "INSERT INTO payment_heads (name, school_id, academic_year) VALUES (?, ?, ?)",
                    dto.getName(), schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Payment Head already exists: " + dto.getName());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return PaymentHead.builder()
                .id(lastId)
                .name(dto.getName())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public PaymentHead updatePaymentHead(String schoolId, Long id, PaymentHeadDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // Check if the new name already exists for another record
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM payment_heads WHERE name = ? AND school_id = ? AND academic_year = ? AND id != ?",
                Integer.class,
                dto.getName(), schoolId, dto.getAcademicYear(), id
        );

        if (count != null && count > 0) {
            throw new RuntimeException("Payment Head already exists: " + dto.getName());
        }

        int rows = jdbc.update(
                "UPDATE payment_heads SET name = ? WHERE id = ?",
                dto.getName(), id
        );
        if (rows == 0) throw new RuntimeException("Payment Head not found with id " + id);

        return jdbc.queryForObject(
                "SELECT * FROM payment_heads WHERE id = ?",
                new BeanPropertyRowMapper<>(PaymentHead.class),
                id
        );
    }

    public void deletePaymentHead(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM payment_heads WHERE id = ?", id);
        if (rows == 0) throw new RuntimeException("Payment Head not found with id " + id);
    }
}