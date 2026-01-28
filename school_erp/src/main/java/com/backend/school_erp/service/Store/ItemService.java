package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.ItemDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Store.Item;
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
public class ItemService {
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
            CREATE TABLE IF NOT EXISTS items (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                item_code VARCHAR(50) NOT NULL,
                item_name VARCHAR(100) NOT NULL,
                purchase_rate VARCHAR(50),
                `group` VARCHAR(50),
                unit VARCHAR(50),
                gst_type VARCHAR(50),
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_item (item_code, school_id, academic_year)
            )
        """);
    }

    public List<Item> getItems(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM items WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(Item.class),
                schoolId, academicYear
        );
    }

    public Item addItem(String schoolId, ItemDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            jdbc.update(
                    "INSERT INTO items (item_code, item_name, purchase_rate, `group`, unit, gst_type, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    dto.getItemCode(), dto.getItemName(), dto.getPurchaseRate(), dto.getGroup(),
                    dto.getUnit(), dto.getGstType(), schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Item already exists for code: " + dto.getItemCode());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return Item.builder()
                .id(lastId)
                .itemCode(dto.getItemCode())
                .itemName(dto.getItemName())
                .purchaseRate(dto.getPurchaseRate())
                .group(dto.getGroup())
                .unit(dto.getUnit())
                .gstType(dto.getGstType())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public Item updateItem(String schoolId, Long id, ItemDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update(
                "UPDATE items SET item_name = ?, purchase_rate = ?, `group` = ?, unit = ?, gst_type = ? WHERE id = ?",
                dto.getItemName(), dto.getPurchaseRate(), dto.getGroup(), dto.getUnit(), dto.getGstType(), id
        );
        if (rows == 0) throw new RuntimeException("Item not found with id " + id);

        return jdbc.queryForObject(
                "SELECT * FROM items WHERE id = ?",
                new BeanPropertyRowMapper<>(Item.class),
                id
        );
    }

    public void deleteItem(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM items WHERE id = ?", id);
        if (rows == 0) throw new RuntimeException("Item not found with id " + id);
    }
}