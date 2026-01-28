package com.backend.school_erp.service.Transport;

import com.backend.school_erp.DTO.Transport.PlaceDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Transport.Place;
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
public class PlaceService {
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
            CREATE TABLE IF NOT EXISTS places (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                place_name VARCHAR(100) NOT NULL,
                route_number VARCHAR(100),
                driver_name VARCHAR(100),
                conductor_name VARCHAR(100),
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_place (place_name, school_id, academic_year)
            )
        """);
    }

    public List<Place> getPlaces(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM places WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(Place.class),
                schoolId, academicYear
        );
    }

    public Place addPlace(String schoolId, PlaceDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            jdbc.update(
                    "INSERT INTO places (place_name, route_number, driver_name, conductor_name, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?)",
                    dto.getPlaceName(), dto.getRouteNumber(), dto.getDriverName(), dto.getConductorName(), schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Place already exists: " + dto.getPlaceName());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return Place.builder()
                .id(lastId)
                .placeName(dto.getPlaceName())
                .routeNumber(dto.getRouteNumber())
                .driverName(dto.getDriverName())
                .conductorName(dto.getConductorName())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public Place updatePlace(String schoolId, Long id, PlaceDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update(
                "UPDATE places SET place_name = ?, route_number = ?, driver_name = ?, conductor_name = ? WHERE id = ?",
                dto.getPlaceName(), dto.getRouteNumber(), dto.getDriverName(), dto.getConductorName(), id
        );
        if (rows == 0) throw new RuntimeException("Place not found with id " + id);

        return jdbc.queryForObject(
                "SELECT * FROM places WHERE id = ?",
                new BeanPropertyRowMapper<>(Place.class),
                id
        );
    }

    public void deletePlace(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM places WHERE id = ?", id);
        if (rows == 0) throw new RuntimeException("Place not found with id " + id);
    }
}