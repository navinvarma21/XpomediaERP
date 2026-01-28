package com.backend.school_erp.service.Library;

import com.backend.school_erp.DTO.Administration.StaffStudentDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.StaffStudent;
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
public class StaffStudentService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
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
        jdbc.execute("CREATE TABLE IF NOT EXISTS staff_student (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "record_code VARCHAR(100) NOT NULL, " +
                "full_name VARCHAR(255) NOT NULL, " +
                "number_street_name VARCHAR(500), " +
                "place_pin_code VARCHAR(100), " +
                "state_id VARCHAR(50), " +
                "state VARCHAR(100), " +
                "district_id VARCHAR(50), " +
                "district VARCHAR(100), " +
                "phone_number VARCHAR(20), " +
                "email VARCHAR(150), " +
                "contact_person VARCHAR(150), " +
                "record_type VARCHAR(20) NOT NULL, " +  // STAFF or STUDENT
                "original_id VARCHAR(100), " +          // Staff Code or Admission Number
                "school_id VARCHAR(50) NOT NULL, " +
                "academic_year VARCHAR(20) NOT NULL, " +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                "UNIQUE KEY unique_record (record_code, school_id, academic_year)" +
                ")");

        log.info("✅ staff_student table ensured");
    }

    public List<StaffStudent> getAll(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = "SELECT * FROM staff_student WHERE school_id = ? AND academic_year = ? ORDER BY created_at DESC";
        return jdbc.query(sql, new BeanPropertyRowMapper<>(StaffStudent.class), schoolId, academicYear);
    }

    public Optional<StaffStudent> getById(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            StaffStudent record = jdbc.queryForObject(
                    "SELECT * FROM staff_student WHERE id = ? AND school_id = ?",
                    new BeanPropertyRowMapper<>(StaffStudent.class),
                    id, schoolId
            );
            return Optional.ofNullable(record);
        } catch (Exception e) {
            log.error("Error fetching record by id {}: {}", id, e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<StaffStudent> create(StaffStudentDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(dto.getSchoolId());
        ensureTableExists(jdbc);

        LocalDateTime now = LocalDateTime.now();

        String sql = "INSERT INTO staff_student (record_code, full_name, number_street_name, " +
                "place_pin_code, state_id, state, district_id, district, phone_number, " +
                "email, contact_person, record_type, original_id, school_id, academic_year, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try {
            int rows = jdbc.update(sql,
                    dto.getRecordCode(),
                    dto.getFullName(),
                    dto.getNumberStreetName(),
                    dto.getPlacePinCode(),
                    dto.getStateId(),
                    dto.getState(),
                    dto.getDistrictId(),
                    dto.getDistrict(),
                    dto.getPhoneNumber(),
                    dto.getEmail(),
                    dto.getContactPerson(),
                    dto.getRecordType(),
                    dto.getOriginalId(),
                    dto.getSchoolId(),
                    dto.getAcademicYear(),
                    now,
                    now
            );

            if (rows > 0) {
                Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
                return getById(dto.getSchoolId(), lastId);
            }
        } catch (Exception e) {
            log.error("Error creating staff/student record: {}", e.getMessage());
        }

        return Optional.empty();
    }

    public Optional<StaffStudent> update(String schoolId, Long id, StaffStudentDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = "UPDATE staff_student SET " +
                "full_name = ?, number_street_name = ?, place_pin_code = ?, " +
                "state_id = ?, state = ?, district_id = ?, district = ?, " +
                "phone_number = ?, email = ?, contact_person = ?, " +
                "record_type = ?, original_id = ?, updated_at = ? " +
                "WHERE id = ? AND school_id = ?";

        try {
            int rows = jdbc.update(sql,
                    dto.getFullName(),
                    dto.getNumberStreetName(),
                    dto.getPlacePinCode(),
                    dto.getStateId(),
                    dto.getState(),
                    dto.getDistrictId(),
                    dto.getDistrict(),
                    dto.getPhoneNumber(),
                    dto.getEmail(),
                    dto.getContactPerson(),
                    dto.getRecordType(),
                    dto.getOriginalId(),
                    LocalDateTime.now(),
                    id,
                    schoolId
            );

            if (rows > 0) {
                return getById(schoolId, id);
            }
        } catch (Exception e) {
            log.error("Error updating staff/student record: {}", e.getMessage());
        }

        return Optional.empty();
    }

    public boolean delete(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            int rows = jdbc.update("DELETE FROM staff_student WHERE id = ? AND school_id = ?", id, schoolId);
            return rows > 0;
        } catch (Exception e) {
            log.error("Error deleting staff/student record: {}", e.getMessage());
            return false;
        }
    }

    public List<StaffStudent> getByType(String schoolId, String academicYear, String type) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = "SELECT * FROM staff_student WHERE school_id = ? AND academic_year = ? AND record_type = ? ORDER BY created_at DESC";
        return jdbc.query(sql, new BeanPropertyRowMapper<>(StaffStudent.class), schoolId, academicYear, type);
    }

    // Check if record already exists by code
    public boolean existsByRecordCode(String schoolId, String academicYear, String recordCode) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM staff_student WHERE school_id = ? AND academic_year = ? AND record_code = ?",
                    Integer.class,
                    schoolId, academicYear, recordCode
            );
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }
}