package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.ItemGroupDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Store.ItemGroup;
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
public class ItemGroupService {
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
        jdbc.execute("CREATE TABLE IF NOT EXISTS item_groups (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "group_name VARCHAR(255) NOT NULL, " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");
    }

    public List<ItemGroup> getGroups(String schoolId, String year) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query("SELECT * FROM item_groups WHERE academic_year = ?",
                new BeanPropertyRowMapper<>(ItemGroup.class), year);
    }

    public ItemGroup addGroup(String schoolId, ItemGroupDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        jdbc.update("INSERT INTO item_groups (group_name, school_id, academic_year) VALUES (?, ?, ?)",
                dto.getGroupName(), schoolId, dto.getAcademicYear());

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return ItemGroup.builder()
                .id(lastId)
                .groupName(dto.getGroupName())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public void deleteGroup(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        jdbc.update("DELETE FROM item_groups WHERE id = ?", id);
    }
}