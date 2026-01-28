package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.CustomerStaffDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Store.CustomerStaff;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class CustomerStaffService {

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
        jdbc.execute("CREATE TABLE IF NOT EXISTS customer_staff (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "customer_staff_code VARCHAR(50), " +
                "customer_staff_name VARCHAR(100), " +
                "number_street_name VARCHAR(255), " +
                "place_pin_code VARCHAR(100), " +
                "state_id VARCHAR(50), " +
                "state VARCHAR(100), " +
                "district_id VARCHAR(50), " +
                "district VARCHAR(100), " +
                "phone_number VARCHAR(20), " +
                "email VARCHAR(100), " +
                "contact_person VARCHAR(100), " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20), " +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
                ")");
    }

    public List<CustomerStaff> getAll(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query("SELECT * FROM customer_staff WHERE academic_year = ?",
                new BeanPropertyRowMapper<>(CustomerStaff.class), academicYear);
    }

    public Optional<CustomerStaff> create(CustomerStaffDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(dto.getSchoolId());
        ensureTableExists(jdbc);

        jdbc.update("INSERT INTO customer_staff (customer_staff_code, customer_staff_name, number_street_name, " +
                        "place_pin_code, state_id, state, district_id, district, phone_number, email, contact_person, school_id, academic_year, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                dto.getCustomerStaffCode(), dto.getCustomerStaffName(), dto.getNumberStreetName(),
                dto.getPlacePinCode(), dto.getStateId(), dto.getState(), dto.getDistrictId(),
                dto.getDistrict(), dto.getPhoneNumber(), dto.getEmail(), dto.getContactPerson(),
                dto.getSchoolId(), dto.getAcademicYear(), LocalDateTime.now(), LocalDateTime.now());

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return getById(dto.getSchoolId(), lastId);
    }

    public Optional<CustomerStaff> update(String schoolId, Long id, CustomerStaffDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("UPDATE customer_staff SET customer_staff_name = ?, number_street_name = ?, " +
                        "place_pin_code = ?, state_id = ?, state = ?, district_id = ?, district = ?, phone_number = ?, " +
                        "email = ?, contact_person = ?, updated_at = ? WHERE id = ?",
                dto.getCustomerStaffName(), dto.getNumberStreetName(), dto.getPlacePinCode(),
                dto.getStateId(), dto.getState(), dto.getDistrictId(), dto.getDistrict(),
                dto.getPhoneNumber(), dto.getEmail(), dto.getContactPerson(), LocalDateTime.now(), id);

        if (rows > 0) return getById(schoolId, id);
        return Optional.empty();
    }

    public boolean delete(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.update("DELETE FROM customer_staff WHERE id = ?", id) > 0;
    }

    public Optional<CustomerStaff> getById(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        try {
            CustomerStaff staff = jdbc.queryForObject("SELECT * FROM customer_staff WHERE id = ?",
                    new BeanPropertyRowMapper<>(CustomerStaff.class), id);
            return Optional.ofNullable(staff);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}