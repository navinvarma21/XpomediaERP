package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.PaymentSubHeadDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.PaymentSubHead;
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
public class PaymentSubHeadService {

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
            CREATE TABLE IF NOT EXISTS payment_sub_heads (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                payment_main_head VARCHAR(100) NOT NULL,
                payment_sub_head VARCHAR(100) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_payment_sub_head (payment_main_head, payment_sub_head, school_id, academic_year)
            )
        """);
    }

    public List<PaymentSubHead> getPaymentSubHeads(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM payment_sub_heads WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(PaymentSubHead.class),
                schoolId, academicYear
        );
    }

    public PaymentSubHead addPaymentSubHead(String schoolId, PaymentSubHeadDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // Verify that the main head exists in payment_heads table
        Integer mainHeadCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM payment_heads WHERE name = ? AND school_id = ? AND academic_year = ?",
                Integer.class,
                dto.getPaymentMainHead(), schoolId, dto.getAcademicYear()
        );

        if (mainHeadCount == null || mainHeadCount == 0) {
            throw new RuntimeException("Main payment head not found: " + dto.getPaymentMainHead());
        }

        try {
            jdbc.update(
                    "INSERT INTO payment_sub_heads (payment_main_head, payment_sub_head, school_id, academic_year) VALUES (?, ?, ?, ?)",
                    dto.getPaymentMainHead(), dto.getPaymentSubHead(), schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Payment Sub Head already exists under this main head: " + dto.getPaymentSubHead());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return PaymentSubHead.builder()
                .id(lastId)
                .paymentMainHead(dto.getPaymentMainHead())
                .paymentSubHead(dto.getPaymentSubHead())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public PaymentSubHead updatePaymentSubHead(String schoolId, Long id, PaymentSubHeadDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // Verify that the main head exists in payment_heads table
        Integer mainHeadCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM payment_heads WHERE name = ? AND school_id = ? AND academic_year = ?",
                Integer.class,
                dto.getPaymentMainHead(), schoolId, dto.getAcademicYear()
        );

        if (mainHeadCount == null || mainHeadCount == 0) {
            throw new RuntimeException("Main payment head not found: " + dto.getPaymentMainHead());
        }

        // Check if the new name already exists for another sub head under the same main head
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM payment_sub_heads WHERE payment_main_head = ? AND payment_sub_head = ? AND school_id = ? AND academic_year = ? AND id != ?",
                Integer.class,
                dto.getPaymentMainHead(), dto.getPaymentSubHead(), schoolId, dto.getAcademicYear(), id
        );

        if (count != null && count > 0) {
            throw new RuntimeException("Payment Sub Head already exists under this main head: " + dto.getPaymentSubHead());
        }

        int rows = jdbc.update(
                "UPDATE payment_sub_heads SET payment_main_head = ?, payment_sub_head = ? WHERE id = ?",
                dto.getPaymentMainHead(), dto.getPaymentSubHead(), id
        );
        if (rows == 0) throw new RuntimeException("Payment Sub Head not found with id " + id);

        return jdbc.queryForObject(
                "SELECT * FROM payment_sub_heads WHERE id = ?",
                new BeanPropertyRowMapper<>(PaymentSubHead.class),
                id
        );
    }

    public void deletePaymentSubHead(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM payment_sub_heads WHERE id = ?", id);
        if (rows == 0) throw new RuntimeException("Payment Sub Head not found with id " + id);
    }
}