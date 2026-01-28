package com.backend.school_erp.service.Student.Login;

// 1. Import the Centralized Config
import com.backend.school_erp.config.DatabaseConfig;

import com.backend.school_erp.DTO.Student.Login.StudentLoginRequestDTO;
import com.backend.school_erp.DTO.Student.Login.StudentLoginResponseDTO;
import com.backend.school_erp.entity.Student.Login.SSchoolEntity;
import com.backend.school_erp.entity.Student.Login.StudentAccount;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class StudentAuthService {

    private final StudentSchoolService schoolService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final Map<String, DataSource> dataSourceCache;

    public StudentAuthService(StudentSchoolService schoolService) {
        this.schoolService = schoolService;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.objectMapper = new ObjectMapper();
        this.dataSourceCache = new ConcurrentHashMap<>();
    }

    public StudentLoginResponseDTO studentLogin(StudentLoginRequestDTO loginRequest) {
        try {
            // Step 1: Validate school code and get school details
            SSchoolEntity school = schoolService.findSchoolByCode(loginRequest.getSchoolCode());
            if (school == null) {
                return new StudentLoginResponseDTO(false, "Invalid school code");
            }

            if (!schoolService.isSchoolActive(school)) {
                return new StudentLoginResponseDTO(false, "School is not active");
            }

            // Step 2: Get academic year
            String academicYear = school.getCurrentAcademicYear();
            if (academicYear == null || academicYear.trim().isEmpty()) {
                return new StudentLoginResponseDTO(false, "Academic year not configured for school");
            }

            // Step 3: Get student account from school-specific database
            StudentAccount studentAccount = findStudentAccount(
                    school.getSchoolId(),
                    loginRequest.getUserName(),
                    academicYear
            );

            if (studentAccount == null) {
                return new StudentLoginResponseDTO(false, "Student account not found");
            }

            if (!studentAccount.getIsActive()) {
                return new StudentLoginResponseDTO(false, "Student account is inactive");
            }

            // Step 4: Verify password
            if (!passwordEncoder.matches(loginRequest.getPassword(), studentAccount.getPassword())) {
                return new StudentLoginResponseDTO(false, "Invalid password");
            }

            // Step 5: Extract user details
            Map<String, Object> userDetails = extractUserDetails(studentAccount.getUserDetails());

            // Step 6: Generate token (simplified - in real scenario use JWT)
            String token = generateAuthToken(studentAccount, school);

            // Step 7: Prepare success response
            return new StudentLoginResponseDTO(
                    true,
                    token,
                    studentAccount.getId().toString(),
                    getStudentNameFromDetails(userDetails),
                    school.getSchoolCode(),
                    school.getSchoolName(),
                    school.getSchoolId(),
                    userDetails
            );

        } catch (Exception e) {
            log.error("Student login error: {}", e.getMessage(), e);
            return new StudentLoginResponseDTO(false, "Login failed: " + e.getMessage());
        }
    }

    private StudentAccount findStudentAccount(String schoolId, String username, String academicYear) {
        try {
            JdbcTemplate jdbcTemplate = getJdbcTemplateForSchool(schoolId);
            String tableName = getStudentTableName(academicYear);

            // Check if table exists
            if (!tableExists(jdbcTemplate, tableName)) {
                log.error("Student table not found: {}", tableName);
                return null;
            }

            String sql = String.format(
                    "SELECT * FROM %s WHERE username = ? AND school_id = ? AND is_active = true",
                    tableName
            );

            return jdbcTemplate.queryForObject(sql,
                    new BeanPropertyRowMapper<>(StudentAccount.class),
                    username, schoolId);

        } catch (Exception e) {
            log.error("Error finding student account: {}", e.getMessage());
            return null;
        }
    }

    private JdbcTemplate getJdbcTemplateForSchool(String schoolId) {
        DataSource dataSource = dataSourceCache.computeIfAbsent(schoolId, id -> {
            // Create datasource for school-specific database
            return createDataSourceForSchool(id);
        });
        return new JdbcTemplate(dataSource);
    }

    private DataSource createDataSourceForSchool(String schoolId) {
        // 2. Updated to use centralized AWS RDS constants
        com.zaxxer.hikari.HikariConfig config = new com.zaxxer.hikari.HikariConfig();

        config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + schoolId + DatabaseConfig.DB_PARAMS);
        config.setUsername(DatabaseConfig.AWS_DB_USER);
        config.setPassword(DatabaseConfig.AWS_DB_PASS);
        config.setDriverClassName(DatabaseConfig.JDBC_DRIVER);

        // --- Pool tuning ---
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setIdleTimeout(60000);
        config.setMaxLifetime(1800000);
        config.setConnectionTimeout(15000);
        config.setLeakDetectionThreshold(60000);
        config.setConnectionTestQuery("SELECT 1");

        return new com.zaxxer.hikari.HikariDataSource(config);
    }

    private String getStudentTableName(String academicYear) {
        String cleanAcademicYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        return "students_account_" + cleanAcademicYear;
    }

    private boolean tableExists(JdbcTemplate jdbcTemplate, String tableName) {
        try {
            jdbcTemplate.queryForObject("SELECT 1 FROM " + tableName + " LIMIT 1", Integer.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractUserDetails(String userDetailsJson) {
        try {
            if (userDetailsJson != null && !userDetailsJson.trim().isEmpty()) {
                return objectMapper.readValue(userDetailsJson, Map.class);
            }
        } catch (Exception e) {
            log.warn("Failed to parse user details JSON: {}", e.getMessage());
        }
        return Map.of();
    }

    private String getStudentNameFromDetails(Map<String, Object> userDetails) {
        return userDetails.getOrDefault("name", "Student").toString();
    }

    private String generateAuthToken(StudentAccount studentAccount, SSchoolEntity school) {
        // Simplified token generation
        String tokenData = studentAccount.getId() + ":" + school.getSchoolId() + ":" + System.currentTimeMillis();
        return java.util.Base64.getEncoder().encodeToString(tokenData.getBytes());
    }
}