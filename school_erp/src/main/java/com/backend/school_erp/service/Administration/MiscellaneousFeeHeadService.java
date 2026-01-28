package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.MiscellaneousFeeHeadDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.MiscellaneousFeeHead;
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
public class MiscellaneousFeeHeadService {

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
            CREATE TABLE IF NOT EXISTS miscellaneous_fee_heads (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                fee_head VARCHAR(100) NOT NULL,
                account_head VARCHAR(100) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_misc_fee_head (fee_head, school_id, academic_year)
            )
        """);
    }

    public List<MiscellaneousFeeHead> getMiscellaneousFeeHeads(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM miscellaneous_fee_heads WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(MiscellaneousFeeHead.class),
                schoolId, academicYear
        );
    }

    public MiscellaneousFeeHead addMiscellaneousFeeHead(String schoolId, MiscellaneousFeeHeadDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // Validate input
        if (dto.getFeeHead() == null || dto.getFeeHead().trim().isEmpty()) {
            throw new RuntimeException("Fee Head cannot be empty");
        }
        if (dto.getAccountHead() == null || dto.getAccountHead().trim().isEmpty()) {
            throw new RuntimeException("Account Head cannot be empty");
        }

        try {
            jdbc.update(
                    "INSERT INTO miscellaneous_fee_heads (fee_head, account_head, school_id, academic_year) VALUES (?, ?, ?, ?)",
                    dto.getFeeHead(), dto.getAccountHead(), schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Miscellaneous Fee Head already exists: " + dto.getFeeHead());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return MiscellaneousFeeHead.builder()
                .id(lastId)
                .feeHead(dto.getFeeHead())
                .accountHead(dto.getAccountHead())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public MiscellaneousFeeHead updateMiscellaneousFeeHead(String schoolId, Long id, MiscellaneousFeeHeadDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // Validate input
        if (dto.getFeeHead() == null || dto.getFeeHead().trim().isEmpty()) {
            throw new RuntimeException("Fee Head cannot be empty");
        }
        if (dto.getAccountHead() == null || dto.getAccountHead().trim().isEmpty()) {
            throw new RuntimeException("Account Head cannot be empty");
        }

        // First check if exists
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM miscellaneous_fee_heads WHERE id = ? AND school_id = ?",
                Integer.class,
                id, schoolId
        );

        if (count == null || count == 0) {
            throw new RuntimeException("Miscellaneous Fee Head not found with id " + id);
        }

        // Check for duplicate name (excluding current record)
        count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM miscellaneous_fee_heads WHERE fee_head = ? AND school_id = ? AND academic_year = ? AND id != ?",
                Integer.class,
                dto.getFeeHead(), schoolId, dto.getAcademicYear(), id
        );

        if (count != null && count > 0) {
            throw new RuntimeException("Miscellaneous Fee Head already exists: " + dto.getFeeHead());
        }

        int rows = jdbc.update(
                "UPDATE miscellaneous_fee_heads SET fee_head = ?, account_head = ? WHERE id = ?",
                dto.getFeeHead(), dto.getAccountHead(), id
        );

        if (rows == 0) {
            throw new RuntimeException("Failed to update Miscellaneous Fee Head with id " + id);
        }

        return jdbc.queryForObject(
                "SELECT * FROM miscellaneous_fee_heads WHERE id = ?",
                new BeanPropertyRowMapper<>(MiscellaneousFeeHead.class),
                id
        );
    }

    public void deleteMiscellaneousFeeHead(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM miscellaneous_fee_heads WHERE id = ?", id);
        if (rows == 0) {
            throw new RuntimeException("Miscellaneous Fee Head not found with id " + id);
        }
    }
}