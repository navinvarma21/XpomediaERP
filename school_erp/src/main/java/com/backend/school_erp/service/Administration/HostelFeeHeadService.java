package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.HostelFeeHeadDTO;
import com.backend.school_erp.entity.Administration.HostelFeeHead;
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
import com.backend.school_erp.config.DatabaseConfig;
@Service
@Slf4j
public class HostelFeeHeadService {

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
            CREATE TABLE IF NOT EXISTS hostel_fee_heads (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                fee_head VARCHAR(255) NOT NULL,
                account_head VARCHAR(255) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_fee_head (fee_head, school_id, year)
            )
        """);
    }

    // ---------------- Get All Fee Heads ----------------
    public List<HostelFeeHead> getFeeHeads(String schoolId, String year) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM hostel_fee_heads WHERE school_id = ? AND year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(HostelFeeHead.class),
                schoolId, year
        );
    }

    // ---------------- Add Fee Head ----------------
    public HostelFeeHead addFeeHead(String schoolId, HostelFeeHeadDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        try {
            jdbc.update(
                    "INSERT INTO hostel_fee_heads (fee_head, account_head, school_id, year) VALUES (?, ?, ?, ?)",
                    dto.getFeeHead(), dto.getAccountHead(), schoolId, dto.getYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Hostel Fee Head already exists: " + dto.getFeeHead());
        }
        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return HostelFeeHead.builder()
                .id(lastId)
                .feeHead(dto.getFeeHead())
                .accountHead(dto.getAccountHead())
                .schoolId(schoolId)
                .year(dto.getYear())
                .build();
    }

    // ---------------- Update Fee Head ----------------
    public HostelFeeHead updateFeeHead(String schoolId, Long id, HostelFeeHeadDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        int rows = jdbc.update(
                "UPDATE hostel_fee_heads SET fee_head = ?, account_head = ? WHERE id = ? AND school_id = ?",
                dto.getFeeHead(), dto.getAccountHead(), id, schoolId
        );
        if (rows == 0) throw new RuntimeException("Hostel Fee Head not found with id " + id);

        return jdbc.queryForObject(
                "SELECT * FROM hostel_fee_heads WHERE id = ? AND school_id = ?",
                new BeanPropertyRowMapper<>(HostelFeeHead.class),
                id, schoolId
        );
    }

    // ---------------- Delete Fee Head ----------------
    public void deleteFeeHead(String schoolId, Long id, String year) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        int rows = jdbc.update(
                "DELETE FROM hostel_fee_heads WHERE id = ? AND school_id = ? AND year = ?",
                id, schoolId, year
        );
        if (rows == 0) throw new RuntimeException("Hostel Fee Head not found with id " + id);
    }
}
