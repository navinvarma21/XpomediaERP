package com.backend.school_erp.service.Transport;

import com.backend.school_erp.DTO.Transport.BusFeeDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Transport.BusFee;
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
public class BusFeeService {
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
            CREATE TABLE IF NOT EXISTS bus_fees (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                boarding_point VARCHAR(100) NOT NULL,
                route_number VARCHAR(100),
                fee_heading VARCHAR(100),
                fee DOUBLE NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_bus_fee (boarding_point, route_number, fee_heading, school_id, academic_year)
            )
        """);
    }

    public List<BusFee> getBusFees(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM bus_fees WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(BusFee.class),
                schoolId, academicYear
        );
    }

    public BusFee addBusFee(String schoolId, BusFeeDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            jdbc.update(
                    "INSERT INTO bus_fees (boarding_point, route_number, fee_heading, fee, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?)",
                    dto.getBoardingPoint(), dto.getRouteNumber(), dto.getFeeHeading(), dto.getFee(), schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Bus fee already exists for this combination: " + dto.getBoardingPoint() + ", " + dto.getRouteNumber() + ", " + dto.getFeeHeading());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return BusFee.builder()
                .id(lastId)
                .boardingPoint(dto.getBoardingPoint())
                .routeNumber(dto.getRouteNumber())
                .feeHeading(dto.getFeeHeading())
                .fee(dto.getFee())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public BusFee updateBusFee(String schoolId, Long id, BusFeeDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update(
                "UPDATE bus_fees SET boarding_point = ?, route_number = ?, fee_heading = ?, fee = ? WHERE id = ?",
                dto.getBoardingPoint(), dto.getRouteNumber(), dto.getFeeHeading(), dto.getFee(), id
        );
        if (rows == 0) throw new RuntimeException("Bus fee not found with id " + id);

        return jdbc.queryForObject(
                "SELECT * FROM bus_fees WHERE id = ?",
                new BeanPropertyRowMapper<>(BusFee.class),
                id
        );
    }

    public void deleteBusFee(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM bus_fees WHERE id = ?", id);
        if (rows == 0) throw new RuntimeException("Bus fee not found with id " + id);
    }
}