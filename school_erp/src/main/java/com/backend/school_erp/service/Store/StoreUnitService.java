package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.StoreUnitDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Store.StoreUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class StoreUnitService {
    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private void ensureTableExists(JdbcTemplate jdbc) {
        jdbc.execute("CREATE TABLE IF NOT EXISTS store_units (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "unit_name VARCHAR(255) NOT NULL, " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");
    }

    public List<StoreUnit> getUnits(String schoolId, String year) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query("SELECT * FROM store_units WHERE academic_year = ?",
                new BeanPropertyRowMapper<>(StoreUnit.class), year);
    }

    public StoreUnit addUnit(String schoolId, StoreUnitDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        jdbc.update("INSERT INTO store_units (unit_name, school_id, academic_year) VALUES (?, ?, ?)",
                dto.getUnitName(), schoolId, dto.getAcademicYear());

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return StoreUnit.builder()
                .id(lastId)
                .unitName(dto.getUnitName())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public void deleteUnit(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        jdbc.update("DELETE FROM store_units WHERE id = ?", id);
    }
}