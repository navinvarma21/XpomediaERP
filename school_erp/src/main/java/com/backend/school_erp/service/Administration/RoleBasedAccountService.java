package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.*;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.RoleBasedAccount;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class RoleBasedAccountService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /** Cache of DataSources per school */
    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    /** Get pooled DataSource for a school (creates if missing) */
    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating HikariCP DataSource for school: {}", id);
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");

            // --- Pool tuning for 5000+ students & 300+ teachers ---
            config.setMaximumPoolSize(20);    // Increased for better concurrency
            config.setMinimumIdle(5);
            config.setIdleTimeout(60000);     // 60 sec
            config.setMaxLifetime(1800000);   // 30 min
            config.setConnectionTimeout(15000); // 15 sec wait before timeout
            config.setLeakDetectionThreshold(60000); // Detect connection leaks
            config.setConnectionTestQuery("SELECT 1"); // Connection validation

            return new HikariDataSource(config);
        });
    }

    /** Get JdbcTemplate for a school */
    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    /** Get table name based on role and academic year */
    private String getTableName(String role, String academicYear) {
        // Remove special characters from academic year for table name
        String cleanAcademicYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");

        if ("TEACHER".equals(role)) {
            return "teachers_account_" + cleanAcademicYear;
        } else if ("STUDENT".equals(role)) {
            return "students_account_" + cleanAcademicYear;
        } else {
            throw new IllegalArgumentException("Invalid role: " + role);
        }
    }

    /** Ensure table exists for specific role and academic year */
    private void ensureTableExists(JdbcTemplate jdbc, String role, String academicYear) {
        String tableName = getTableName(role, academicYear);

        String createTableSQL = String.format("""
            CREATE TABLE IF NOT EXISTS %s (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                school_id VARCHAR(50) NOT NULL,
                school_code VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL,
                user_details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                INDEX idx_school_year (school_id, academic_year),
                INDEX idx_username (username),
                INDEX idx_role (role),
                INDEX idx_active (is_active),
                INDEX idx_created_at (created_at)
            )
        """, tableName);

        jdbc.execute(createTableSQL);
        log.info("✅ Table {} ensured to exist", tableName);
    }

    /** Create role-based account */
    public RoleBasedAccountResponseDTO createAccount(String schoolId, CreateAccountRequestDTO request) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String tableName = getTableName(request.getRole(), request.getAcademicYear());
        ensureTableExists(jdbc, request.getRole(), request.getAcademicYear());

        // Check if username already exists in the specific academic year table
        Integer count = jdbc.queryForObject(
                String.format("SELECT COUNT(*) FROM %s WHERE username = ? AND school_id = ?", tableName),
                Integer.class,
                request.getUsername(), schoolId
        );

        if (count != null && count > 0) {
            throw new RuntimeException("Username already exists: " + request.getUsername());
        }

        // Check if user already has an account based on role in this academic year
        String checkQuery = "";
        String identifier = "";

        if ("TEACHER".equals(request.getRole())) {
            Map<String, Object> userDetails = (Map<String, Object>) request.getUserDetails();
            // FIX: Use staffId from userDetails (which now contains staffCode)
            Object staffIdObj = userDetails.get("staffId");
            identifier = staffIdObj != null ? staffIdObj.toString() : null;
            checkQuery = String.format("SELECT COUNT(*) FROM %s WHERE JSON_EXTRACT(user_details, '$.staffId') = ? AND school_id = ?", tableName);
        } else if ("STUDENT".equals(request.getRole())) {
            Map<String, Object> userDetails = (Map<String, Object>) request.getUserDetails();
            Object admissionNoObj = userDetails.get("admissionNo");
            identifier = admissionNoObj != null ? admissionNoObj.toString() : null;
            checkQuery = String.format("SELECT COUNT(*) FROM %s WHERE JSON_EXTRACT(user_details, '$.admissionNo') = ? AND school_id = ?", tableName);
        }

        if (!checkQuery.isEmpty() && identifier != null) {
            Integer userCount = jdbc.queryForObject(checkQuery, Integer.class, identifier, schoolId);
            if (userCount != null && userCount > 0) {
                throw new RuntimeException("User already has an account created for academic year " + request.getAcademicYear());
            }
        }

        // Encrypt password
        String encryptedPassword = passwordEncoder.encode(request.getPassword());

        // Convert userDetails to JSON string
        String userDetailsJson;
        try {
            userDetailsJson = objectMapper.writeValueAsString(request.getUserDetails());
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize user details", e);
        }

        // Insert account
        int rows = jdbc.update(
                String.format("INSERT INTO %s (school_id, school_code, academic_year, username, password, role, user_details) VALUES (?, ?, ?, ?, ?, ?, ?)", tableName),
                request.getSchoolId(),
                request.getSchoolCode(),
                request.getAcademicYear(),
                request.getUsername(),
                encryptedPassword,
                request.getRole(),
                userDetailsJson
        );

        if (rows == 0) {
            throw new RuntimeException("Failed to create account");
        }

        // Get the created account
        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        RoleBasedAccount account = jdbc.queryForObject(
                String.format("SELECT * FROM %s WHERE id = ?", tableName),
                new BeanPropertyRowMapper<>(RoleBasedAccount.class),
                lastId
        );

        return convertToResponseDTO(account);
    }

    /** Get all accounts for school and academic year (combines both teacher and student accounts) */
    public List<RoleBasedAccountResponseDTO> getAccounts(String schoolId, String academicYear) {
        List<RoleBasedAccountResponseDTO> allAccounts = new ArrayList<>();

        // Get teacher accounts
        try {
            List<RoleBasedAccountResponseDTO> teacherAccounts = getAccountsByRole(schoolId, academicYear, "TEACHER");
            allAccounts.addAll(teacherAccounts);
        } catch (Exception e) {
            log.warn("No teacher accounts table found for academic year {}: {}", academicYear, e.getMessage());
        }

        // Get student accounts
        try {
            List<RoleBasedAccountResponseDTO> studentAccounts = getAccountsByRole(schoolId, academicYear, "STUDENT");
            allAccounts.addAll(studentAccounts);
        } catch (Exception e) {
            log.warn("No student accounts table found for academic year {}: {}", academicYear, e.getMessage());
        }

        // Sort by creation date (newest first)
        allAccounts.sort((a1, a2) -> {
            try {
                LocalDateTime date1 = LocalDateTime.parse(a1.getCreatedAt());
                LocalDateTime date2 = LocalDateTime.parse(a2.getCreatedAt());
                return date2.compareTo(date1);
            } catch (Exception e) {
                return 0;
            }
        });

        return allAccounts;
    }

    /** Get accounts by role and academic year */
    public List<RoleBasedAccountResponseDTO> getAccountsByRole(String schoolId, String academicYear, String role) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String tableName = getTableName(role, academicYear);

        // Check if table exists before querying
        if (!tableExists(jdbc, tableName)) {
            log.info("Table {} does not exist, returning empty list", tableName);
            return new ArrayList<>();
        }

        List<RoleBasedAccount> accounts = jdbc.query(
                String.format("SELECT * FROM %s WHERE school_id = ? AND academic_year = ? ORDER BY created_at DESC", tableName),
                new BeanPropertyRowMapper<>(RoleBasedAccount.class),
                schoolId, academicYear
        );

        return accounts.stream()
                .map(this::convertToResponseDTO)
                .toList();
    }

    /** Get account by username (searches in both teacher and student tables) */
    public Optional<RoleBasedAccountResponseDTO> getAccountByUsername(String schoolId, String username, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        // Search in teacher accounts table
        String teacherTable = getTableName("TEACHER", academicYear);
        if (tableExists(jdbc, teacherTable)) {
            try {
                RoleBasedAccount account = jdbc.queryForObject(
                        String.format("SELECT * FROM %s WHERE school_id = ? AND username = ?", teacherTable),
                        new BeanPropertyRowMapper<>(RoleBasedAccount.class),
                        schoolId, username
                );
                return Optional.of(convertToResponseDTO(account));
            } catch (Exception e) {
                // Account not found in teacher table, continue to student table
            }
        }

        // Search in student accounts table
        String studentTable = getTableName("STUDENT", academicYear);
        if (tableExists(jdbc, studentTable)) {
            try {
                RoleBasedAccount account = jdbc.queryForObject(
                        String.format("SELECT * FROM %s WHERE school_id = ? AND username = ?", studentTable),
                        new BeanPropertyRowMapper<>(RoleBasedAccount.class),
                        schoolId, username
                );
                return Optional.of(convertToResponseDTO(account));
            } catch (Exception e) {
                // Account not found in student table
            }
        }

        return Optional.empty();
    }

    /** Update account password */
    public boolean updatePassword(String schoolId, String username, String newPassword, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String encryptedPassword = passwordEncoder.encode(newPassword);

        // Try updating in teacher table first
        String teacherTable = getTableName("TEACHER", academicYear);
        if (tableExists(jdbc, teacherTable)) {
            int rows = jdbc.update(
                    String.format("UPDATE %s SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE school_id = ? AND username = ?", teacherTable),
                    encryptedPassword, schoolId, username
            );
            if (rows > 0) {
                log.info("Password updated for teacher: {}", username);
                return true;
            }
        }

        // Try updating in student table
        String studentTable = getTableName("STUDENT", academicYear);
        if (tableExists(jdbc, studentTable)) {
            int rows = jdbc.update(
                    String.format("UPDATE %s SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE school_id = ? AND username = ?", studentTable),
                    encryptedPassword, schoolId, username
            );
            if (rows > 0) {
                log.info("Password updated for student: {}", username);
                return true;
            }
        }

        log.warn("Password update failed - account not found: {}", username);
        return false;
    }

    /** Delete account permanently from database */
    public boolean deleteAccount(String schoolId, String username, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        // Try deleting from teacher table first
        String teacherTable = getTableName("TEACHER", academicYear);
        if (tableExists(jdbc, teacherTable)) {
            int rows = jdbc.update(
                    String.format("DELETE FROM %s WHERE school_id = ? AND username = ?", teacherTable),
                    schoolId, username
            );
            if (rows > 0) {
                log.info("Teacher account permanently deleted: {}", username);
                return true;
            }
        }

        // Try deleting from student table
        String studentTable = getTableName("STUDENT", academicYear);
        if (tableExists(jdbc, studentTable)) {
            int rows = jdbc.update(
                    String.format("DELETE FROM %s WHERE school_id = ? AND username = ?", studentTable),
                    schoolId, username
            );
            if (rows > 0) {
                log.info("Student account permanently deleted: {}", username);
                return true;
            }
        }

        log.warn("Account deletion failed - account not found: {}", username);
        return false;
    }

    /** Verify password */
    public boolean verifyPassword(String schoolId, String username, String password, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        // Try teacher table first
        String teacherTable = getTableName("TEACHER", academicYear);
        if (tableExists(jdbc, teacherTable)) {
            try {
                String storedPassword = jdbc.queryForObject(
                        String.format("SELECT password FROM %s WHERE school_id = ? AND username = ?", teacherTable),
                        String.class,
                        schoolId, username
                );
                return passwordEncoder.matches(password, storedPassword);
            } catch (Exception e) {
                // Continue to student table
            }
        }

        // Try student table
        String studentTable = getTableName("STUDENT", academicYear);
        if (tableExists(jdbc, studentTable)) {
            try {
                String storedPassword = jdbc.queryForObject(
                        String.format("SELECT password FROM %s WHERE school_id = ? AND username = ?", studentTable),
                        String.class,
                        schoolId, username
                );
                return passwordEncoder.matches(password, storedPassword);
            } catch (Exception e) {
                return false;
            }
        }

        return false;
    }

    /** Check if username exists in any table for the academic year */
    public boolean usernameExists(String schoolId, String username, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        // Check teacher table
        String teacherTable = getTableName("TEACHER", academicYear);
        if (tableExists(jdbc, teacherTable)) {
            Integer count = jdbc.queryForObject(
                    String.format("SELECT COUNT(*) FROM %s WHERE school_id = ? AND username = ?", teacherTable),
                    Integer.class,
                    schoolId, username
            );
            if (count != null && count > 0) return true;
        }

        // Check student table
        String studentTable = getTableName("STUDENT", academicYear);
        if (tableExists(jdbc, studentTable)) {
            Integer count = jdbc.queryForObject(
                    String.format("SELECT COUNT(*) FROM %s WHERE school_id = ? AND username = ?", studentTable),
                    Integer.class,
                    schoolId, username
            );
            if (count != null && count > 0) return true;
        }

        return false;
    }

    /** Check if table exists */
    private boolean tableExists(JdbcTemplate jdbc, String tableName) {
        try {
            jdbc.queryForObject("SELECT 1 FROM " + tableName + " LIMIT 1", Integer.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** Convert entity to response DTO */
    private RoleBasedAccountResponseDTO convertToResponseDTO(RoleBasedAccount account) {
        Object userDetails = null;
        try {
            if (account.getUserDetails() != null) {
                userDetails = objectMapper.readValue(account.getUserDetails(), Object.class);
            }
        } catch (Exception e) {
            log.warn("Failed to parse user details JSON for account {}", account.getId());
        }

        return RoleBasedAccountResponseDTO.builder()
                .id(account.getId())
                .schoolId(account.getSchoolId())
                .schoolCode(account.getSchoolCode())
                .academicYear(account.getAcademicYear())
                .username(account.getUsername())
                .role(account.getRole())
                .userDetails(userDetails)
                .createdAt(account.getCreatedAt().toString())
                .isActive(account.getIsActive())
                .build();
    }
}