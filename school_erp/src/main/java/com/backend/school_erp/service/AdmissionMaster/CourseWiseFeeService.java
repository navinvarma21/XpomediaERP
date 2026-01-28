package com.backend.school_erp.service.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.CourseWiseFeeDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.AdmissionMaster.CourseWiseFee;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class CourseWiseFeeService {

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
        try {
            // Note: If table exists without account_head, you may need to alter it manually or drop it.
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS course_wise_fees (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    course VARCHAR(100) NOT NULL,
                    sex VARCHAR(20) DEFAULT 'All',
                    fee_head VARCHAR(255) NOT NULL,
                    account_head VARCHAR(255),
                    amount DECIMAL(10,2) NOT NULL,
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_course (course),
                    INDEX idx_school_academic (school_id, academic_year),
                    INDEX idx_fee_head (fee_head),
                    UNIQUE KEY unique_course_fee (course, fee_head, school_id, academic_year)
                )
            """);
        } catch (Exception e) {
            log.error("Failed to create course_wise_fees table: {}", e.getMessage());
            throw new RuntimeException("Database table creation failed", e);
        }
    }

    public List<CourseWiseFee> getCourseWiseFeesBySchool(String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            String sql;
            Object[] params;

            if (academicYear != null && !academicYear.trim().isEmpty()) {
                sql = "SELECT * FROM course_wise_fees WHERE school_id = ? AND academic_year = ? ORDER BY course, fee_head";
                params = new Object[]{schoolId, academicYear};
            } else {
                sql = "SELECT * FROM course_wise_fees WHERE school_id = ? ORDER BY course, fee_head";
                params = new Object[]{schoolId};
            }

            List<CourseWiseFee> courseWiseFees = jdbc.query(
                    sql,
                    new BeanPropertyRowMapper<>(CourseWiseFee.class),
                    params
            );
            return courseWiseFees;
        } catch (Exception e) {
            log.error("Error fetching course-wise fees for school {}: {}", schoolId, e.getMessage());
            return new ArrayList<>();
        }
    }

    public CourseWiseFee addCourseWiseFee(String schoolId, CourseWiseFeeDTO dto) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            if (dto.getCourse() == null || dto.getCourse().trim().isEmpty()) throw new RuntimeException("Course is required");
            if (dto.getFeeHead() == null || dto.getFeeHead().trim().isEmpty()) throw new RuntimeException("Fee head is required");
            if (dto.getAmount() == null || dto.getAmount() <= 0) throw new RuntimeException("Valid amount is required");

            String sex = dto.getSex() != null ? dto.getSex() : "All";
            String academicYear = dto.getAcademicYear() != null ? dto.getAcademicYear() : "";
            String accountHead = dto.getAccountHead() != null ? dto.getAccountHead() : "";

            String checkSql = "SELECT COUNT(*) FROM course_wise_fees WHERE course = ? AND fee_head = ? AND school_id = ? AND academic_year = ?";
            Integer count = jdbc.queryForObject(checkSql, Integer.class, dto.getCourse(), dto.getFeeHead(), schoolId, academicYear);

            if (count != null && count > 0) {
                throw new RuntimeException("Fee for this course and fee head already exists for the given academic year");
            }

            int rows = jdbc.update(
                    "INSERT INTO course_wise_fees (course, sex, fee_head, account_head, amount, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    dto.getCourse(),
                    sex,
                    dto.getFeeHead(),
                    accountHead,
                    dto.getAmount(),
                    schoolId,
                    academicYear
            );

            if (rows == 0) throw new RuntimeException("Failed to insert course-wise fee");

            Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

            return CourseWiseFee.builder()
                    .id(lastId)
                    .course(dto.getCourse())
                    .sex(sex)
                    .feeHead(dto.getFeeHead())
                    .accountHead(accountHead)
                    .amount(dto.getAmount())
                    .schoolId(schoolId)
                    .academicYear(academicYear)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Error adding course-wise fee: {}", e.getMessage());
            throw new RuntimeException("Failed to add course-wise fee: " + e.getMessage(), e);
        }
    }

    public Optional<CourseWiseFee> updateCourseWiseFee(String schoolId, Long id, CourseWiseFeeDTO dto) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);

            if (dto.getCourse() == null || dto.getCourse().trim().isEmpty()) throw new RuntimeException("Course is required");
            if (dto.getFeeHead() == null || dto.getFeeHead().trim().isEmpty()) throw new RuntimeException("Fee head is required");
            if (dto.getAmount() == null || dto.getAmount() <= 0) throw new RuntimeException("Valid amount is required");

            String sex = dto.getSex() != null ? dto.getSex() : "All";
            String academicYear = dto.getAcademicYear() != null ? dto.getAcademicYear() : "";
            String accountHead = dto.getAccountHead() != null ? dto.getAccountHead() : "";

            String checkSql = "SELECT COUNT(*) FROM course_wise_fees WHERE course = ? AND fee_head = ? AND school_id = ? AND academic_year = ? AND id != ?";
            Integer count = jdbc.queryForObject(checkSql, Integer.class, dto.getCourse(), dto.getFeeHead(), schoolId, academicYear, id);

            if (count != null && count > 0) {
                throw new RuntimeException("Fee for this course and fee head already exists for the given academic year");
            }

            int rows = jdbc.update(
                    "UPDATE course_wise_fees SET course = ?, sex = ?, fee_head = ?, account_head = ?, amount = ?, academic_year = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND school_id = ?",
                    dto.getCourse(),
                    sex,
                    dto.getFeeHead(),
                    accountHead,
                    dto.getAmount(),
                    academicYear,
                    id,
                    schoolId
            );

            if (rows == 0) return Optional.empty();

            CourseWiseFee updated = jdbc.queryForObject(
                    "SELECT * FROM course_wise_fees WHERE id = ? AND school_id = ?",
                    new BeanPropertyRowMapper<>(CourseWiseFee.class),
                    id, schoolId
            );

            return Optional.ofNullable(updated);

        } catch (Exception e) {
            log.error("Error updating course-wise fee ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to update course-wise fee: " + e.getMessage(), e);
        }
    }

    public boolean deleteCourseWiseFee(String schoolId, Long id) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTableExists(jdbc);
            int rows = jdbc.update("DELETE FROM course_wise_fees WHERE id = ? AND school_id = ?", id, schoolId);
            return rows > 0;
        } catch (Exception e) {
            log.error("Error deleting course-wise fee ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to delete course-wise fee: " + e.getMessage(), e);
        }
    }
}