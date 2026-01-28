package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.StateDistrictDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.StateDistrict;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class StateDistrictService {

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
            CREATE TABLE IF NOT EXISTS state_district (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                state_id BIGINT NULL,
                school_id VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_entry (name, type, school_id, state_id),
                FOREIGN KEY (state_id) REFERENCES state_district(id) ON DELETE CASCADE
            )
        """);
    }

    public List<StateDistrict> getAll(String type, String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        if ("district".equalsIgnoreCase(type)) {
            return jdbc.query("""
                SELECT sd.*, parent.name as stateName 
                FROM state_district sd 
                LEFT JOIN state_district parent ON sd.state_id = parent.id 
                WHERE sd.type = ? AND sd.school_id = ? 
                ORDER BY sd.id DESC
                """, new BeanPropertyRowMapper<>(StateDistrict.class), type, schoolId);
        } else {
            return jdbc.query(
                    "SELECT * FROM state_district WHERE type = ? AND school_id = ? ORDER BY id DESC",
                    new BeanPropertyRowMapper<>(StateDistrict.class),
                    type, schoolId
            );
        }
    }

    public StateDistrict add(String schoolId, StateDistrictDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        if ("district".equalsIgnoreCase(dto.getType()) && dto.getStateId() != null) {
            Integer stateCount = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM state_district WHERE id = ? AND type = 'state' AND school_id = ?",
                    Integer.class, dto.getStateId(), schoolId
            );
            if (stateCount == null || stateCount == 0) {
                throw new RuntimeException("Invalid state selected");
            }
        }

        int rows = jdbc.update("""
            INSERT INTO state_district (name, type, state_id, school_id)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE id = id
        """, dto.getName(), dto.getType(), dto.getStateId(), dto.getSchoolId());

        if (rows == 0) {
            throw new RuntimeException(dto.getType() + " already exists: " + dto.getName());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return StateDistrict.builder()
                .id(lastId)
                .name(dto.getName())
                .type(dto.getType())
                .stateId(dto.getStateId())
                .schoolId(dto.getSchoolId())
                .build();
    }

    public Optional<StateDistrict> update(String schoolId, Long id, String newName) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("UPDATE state_district SET name = ? WHERE id = ?", newName, id);
        if (rows == 0) return Optional.empty();

        return Optional.ofNullable(jdbc.queryForObject(
                "SELECT * FROM state_district WHERE id = ?",
                new BeanPropertyRowMapper<>(StateDistrict.class),
                id
        ));
    }

    // ✅ Delete with cascading districts
    public boolean delete(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            StateDistrict entry = jdbc.queryForObject(
                    "SELECT * FROM state_district WHERE id = ? AND school_id = ?",
                    new BeanPropertyRowMapper<>(StateDistrict.class),
                    id, schoolId
            );

            if (entry == null) {
                log.warn("❌ Delete failed: Entry with ID {} not found for school {}", id, schoolId);
                return false;
            }

            if ("state".equalsIgnoreCase(entry.getType())) {
                int districtsDeleted = jdbc.update(
                        "DELETE FROM state_district WHERE type = 'district' AND state_id = ? AND school_id = ?",
                        id, schoolId
                );
                log.info("🗑️ Deleted {} districts related to state ID {} for school {}", districtsDeleted, id, schoolId);
            }

            int rowsDeleted = jdbc.update(
                    "DELETE FROM state_district WHERE id = ? AND school_id = ?",
                    id, schoolId
            );

            log.info("✅ Deleted {} entry with ID {} for school {}", rowsDeleted, id, schoolId);
            return rowsDeleted > 0;

        } catch (Exception e) {
            log.error("❌ Exception while deleting entry with ID {} for school {}: {}", id, schoolId, e.getMessage(), e);
            return false;
        }
    }

    public List<StateDistrict> getDistrictsByState(String schoolId, Long stateId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        return jdbc.query(
                "SELECT * FROM state_district WHERE type = 'district' AND state_id = ? AND school_id = ? ORDER BY name",
                new BeanPropertyRowMapper<>(StateDistrict.class),
                stateId, schoolId
        );
    }
}
