package com.backend.school_erp.service.Library;

import com.backend.school_erp.DTO.Library.BookSupplierDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Library.BookSupplier;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class BookSupplierService {

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
            CREATE TABLE IF NOT EXISTS book_suppliers (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                supplier_code VARCHAR(50) NOT NULL,
                supplier_name VARCHAR(100) NOT NULL,
                address VARCHAR(500),
                phone_number VARCHAR(20),
                email VARCHAR(100),
                contact_person VARCHAR(100),
                gst_number VARCHAR(50),
                book_categories VARCHAR(200),
                payment_terms VARCHAR(100),
                delivery_terms VARCHAR(100),
                remarks TEXT,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_book_supplier (supplier_code, school_id, academic_year)
            )
        """);
        log.info("✅ book_suppliers table ensured");
    }

    public List<BookSupplier> getBookSuppliers(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        return jdbc.query(
                "SELECT * FROM book_suppliers WHERE school_id = ? AND academic_year = ? ORDER BY supplier_code ASC",
                new BeanPropertyRowMapper<>(BookSupplier.class),
                schoolId, academicYear
        );
    }

    public BookSupplier addBookSupplier(String schoolId, BookSupplierDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            jdbc.update(
                    "INSERT INTO book_suppliers (supplier_code, supplier_name, address, phone_number, email, contact_person, gst_number, book_categories, payment_terms, delivery_terms, remarks, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    dto.getSupplierCode(), dto.getSupplierName(), dto.getAddress(), dto.getPhoneNumber(),
                    dto.getEmail(), dto.getContactPerson(), dto.getGstNumber(), dto.getBookCategories(),
                    dto.getPaymentTerms(), dto.getDeliveryTerms(), dto.getRemarks(),
                    schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Book supplier already exists with code: " + dto.getSupplierCode());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        return BookSupplier.builder()
                .id(lastId)
                .supplierCode(dto.getSupplierCode())
                .supplierName(dto.getSupplierName())
                .address(dto.getAddress())
                .phoneNumber(dto.getPhoneNumber())
                .email(dto.getEmail())
                .contactPerson(dto.getContactPerson())
                .gstNumber(dto.getGstNumber())
                .bookCategories(dto.getBookCategories())
                .paymentTerms(dto.getPaymentTerms())
                .deliveryTerms(dto.getDeliveryTerms())
                .remarks(dto.getRemarks())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public BookSupplier updateBookSupplier(String schoolId, Long id, BookSupplierDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update(
                "UPDATE book_suppliers SET supplier_name = ?, address = ?, phone_number = ?, email = ?, contact_person = ?, gst_number = ?, book_categories = ?, payment_terms = ?, delivery_terms = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND school_id = ?",
                dto.getSupplierName(), dto.getAddress(), dto.getPhoneNumber(),
                dto.getEmail(), dto.getContactPerson(), dto.getGstNumber(),
                dto.getBookCategories(), dto.getPaymentTerms(), dto.getDeliveryTerms(),
                dto.getRemarks(), id, schoolId
        );

        if (rows == 0) {
            throw new RuntimeException("Book supplier not found with id: " + id);
        }

        return jdbc.queryForObject(
                "SELECT * FROM book_suppliers WHERE id = ?",
                new BeanPropertyRowMapper<>(BookSupplier.class),
                id
        );
    }

    public void deleteBookSupplier(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM book_suppliers WHERE id = ? AND school_id = ?", id, schoolId);

        if (rows == 0) {
            throw new RuntimeException("Book supplier not found with id: " + id);
        }

        log.info("Book supplier deleted successfully: id={}, school={}", id, schoolId);
    }
}