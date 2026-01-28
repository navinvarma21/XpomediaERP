package com.backend.school_erp.service.Teacher.Login;

// 1. Import the Centralized Config
import com.backend.school_erp.config.DatabaseConfig;

import com.backend.school_erp.DTO.Teacher.Login.TeacherLoginRequestDTO;
import com.backend.school_erp.DTO.Teacher.Login.TeacherLoginResponseDTO;
import com.backend.school_erp.entity.Teacher.Login.SchoolEntity;
import com.backend.school_erp.entity.Teacher.Login.TeacherAccount;
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
public class TeacherAuthService {

    private final TeacherSchoolService schoolService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final Map<String, DataSource> dataSourceCache;

    public TeacherAuthService(TeacherSchoolService schoolService) {
        this.schoolService = schoolService;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.objectMapper = new ObjectMapper();
        this.dataSourceCache = new ConcurrentHashMap<>();
    }

    public TeacherLoginResponseDTO teacherLogin(TeacherLoginRequestDTO loginRequest) {
        try {
            // Step 1: Validate school code and get school details
            SchoolEntity school = schoolService.findSchoolByCode(loginRequest.getSchoolCode());
            if (school == null) {
                return new TeacherLoginResponseDTO(false, "Invalid school code");
            }

            if (!schoolService.isSchoolActive(school)) {
                return new TeacherLoginResponseDTO(false, "School is not active");
            }

            // Step 2: Get academic year
            String academicYear = school.getCurrentAcademicYear();
            if (academicYear == null || academicYear.trim().isEmpty()) {
                return new TeacherLoginResponseDTO(false, "Academic year not configured for school");
            }

            // Step 3: Get teacher account from school-specific database
            TeacherAccount teacherAccount = findTeacherAccount(
                    school.getSchoolId(),
                    loginRequest.getUserName(),
                    academicYear
            );

            if (teacherAccount == null) {
                return new TeacherLoginResponseDTO(false, "Teacher account not found");
            }

            if (!teacherAccount.getIsActive()) {
                return new TeacherLoginResponseDTO(false, "Teacher account is inactive");
            }

            // Step 4: Verify password
            if (!passwordEncoder.matches(loginRequest.getPassword(), teacherAccount.getPassword())) {
                return new TeacherLoginResponseDTO(false, "Invalid password");
            }

            // Step 5: Extract user details
            Map<String, Object> userDetails = extractUserDetails(teacherAccount.getUserDetails());

            // Step 6: Generate token (simplified - in real scenario use JWT)
            String token = generateAuthToken(teacherAccount, school);

            // Step 7: Prepare success response
            return new TeacherLoginResponseDTO(
                    true,
                    token,
                    teacherAccount.getId().toString(),
                    getUserNameFromDetails(userDetails),
                    school.getSchoolCode(),
                    school.getSchoolName(),
                    school.getSchoolId(),
                    userDetails
            );

        } catch (Exception e) {
            log.error("Teacher login error: {}", e.getMessage(), e);
            return new TeacherLoginResponseDTO(false, "Login failed: " + e.getMessage());
        }
    }

    private TeacherAccount findTeacherAccount(String schoolId, String username, String academicYear) {
        try {
            JdbcTemplate jdbcTemplate = getJdbcTemplateForSchool(schoolId);
            String tableName = getTeacherTableName(academicYear);

            // Check if table exists
            if (!tableExists(jdbcTemplate, tableName)) {
                log.error("Teacher table not found: {}", tableName);
                return null;
            }

            String sql = String.format(
                    "SELECT * FROM %s WHERE username = ? AND school_id = ? AND is_active = true",
                    tableName
            );

            return jdbcTemplate.queryForObject(sql,
                    new BeanPropertyRowMapper<>(TeacherAccount.class),
                    username, schoolId);

        } catch (Exception e) {
            log.error("Error finding teacher account: {}", e.getMessage());
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

    private String getTeacherTableName(String academicYear) {
        String cleanAcademicYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        return "teachers_account_" + cleanAcademicYear;
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

    private String getUserNameFromDetails(Map<String, Object> userDetails) {
        return userDetails.getOrDefault("name", "Teacher").toString();
    }

    private String generateAuthToken(TeacherAccount teacherAccount, SchoolEntity school) {
        // Simplified token generation
        String tokenData = teacherAccount.getId() + ":" + school.getSchoolId() + ":" + System.currentTimeMillis();
        return java.util.Base64.getEncoder().encodeToString(tokenData.getBytes());
    }
}