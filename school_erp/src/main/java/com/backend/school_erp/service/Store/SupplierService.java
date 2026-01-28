package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.SupplierDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Store.Supplier;
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
public class SupplierService {
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
            CREATE TABLE IF NOT EXISTS suppliers (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                supplier_code VARCHAR(50) NOT NULL,
                supplier_name VARCHAR(100) NOT NULL,
                address VARCHAR(255),
                phone_number VARCHAR(20),
                email VARCHAR(100),
                contact_person VARCHAR(100),
                gst VARCHAR(50),
                other_details TEXT,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_supplier (supplier_code, school_id, academic_year)
            )
        """);
    }

    public List<Supplier> getSuppliers(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM suppliers WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(Supplier.class),
                schoolId, academicYear
        );
    }

    public Supplier addSupplier(String schoolId, SupplierDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            jdbc.update(
                    "INSERT INTO suppliers (supplier_code, supplier_name, address, phone_number, email, contact_person, gst, other_details, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    dto.getSupplierCode(), dto.getSupplierName(), dto.getAddress(), dto.getPhoneNumber(),
                    dto.getEmail(), dto.getContactPerson(), dto.getGst(), dto.getOtherDetails(),
                    schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Supplier already exists for code: " + dto.getSupplierCode());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return Supplier.builder()
                .id(lastId)
                .supplierCode(dto.getSupplierCode())
                .supplierName(dto.getSupplierName())
                .address(dto.getAddress())
                .phoneNumber(dto.getPhoneNumber())
                .email(dto.getEmail())
                .contactPerson(dto.getContactPerson())
                .gst(dto.getGst())
                .otherDetails(dto.getOtherDetails())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public Supplier updateSupplier(String schoolId, Long id, SupplierDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update(
                "UPDATE suppliers SET supplier_name = ?, address = ?, phone_number = ?, email = ?, contact_person = ?, gst = ?, other_details = ? WHERE id = ?",
                dto.getSupplierName(), dto.getAddress(), dto.getPhoneNumber(),
                dto.getEmail(), dto.getContactPerson(), dto.getGst(), dto.getOtherDetails(), id
        );
        if (rows == 0) throw new RuntimeException("Supplier not found with id " + id);

        return jdbc.queryForObject(
                "SELECT * FROM suppliers WHERE id = ?",
                new BeanPropertyRowMapper<>(Supplier.class),
                id
        );
    }

    public void deleteSupplier(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM suppliers WHERE id = ?", id);
        if (rows == 0) throw new RuntimeException("Supplier not found with id " + id);
    }
}