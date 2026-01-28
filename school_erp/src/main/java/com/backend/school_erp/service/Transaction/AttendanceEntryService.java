package com.backend.school_erp.service.Transaction;

import com.backend.school_erp.DTO.Transaction.*;
import com.backend.school_erp.config.DatabaseConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class AttendanceEntryService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();
    private final Set<String> tableExistenceCache = ConcurrentHashMap.newKeySet();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating Optimized DataSource for school: {}", id);

            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            config.setMaximumPoolSize(5);
            config.setMinimumIdle(1);
            config.setIdleTimeout(60000);
            config.setMaxLifetime(1800000);
            config.setConnectionTimeout(5000);
            config.setPoolName("HikariPool-" + id);

            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private String getTableName(String academicYear) {
        return "attendance_" + academicYear.replaceAll("[^a-zA-Z0-9]", "_");
    }

    private void ensureAttendanceTableExists(JdbcTemplate jdbc, String schoolId, String academicYear) {
        String cacheKey = schoolId + "_" + academicYear;
        if (tableExistenceCache.contains(cacheKey)) return;

        String tableName = getTableName(academicYear);
        String createTableSQL = String.format("""
            CREATE TABLE IF NOT EXISTS %s (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                standard VARCHAR(50) NOT NULL,
                section VARCHAR(50) NOT NULL,
                attendance_date DATE NOT NULL,
                student_id BIGINT NOT NULL,
                admission_number VARCHAR(100) NOT NULL,
                student_name VARCHAR(255) NOT NULL,
                attendance_status VARCHAR(5) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                UNIQUE KEY uk_student_date (student_id, attendance_date, academic_year),
                INDEX idx_school_year (school_id, academic_year),
                INDEX idx_standard_section (standard, section),
                INDEX idx_composite (school_id, academic_year, standard, section, attendance_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """, tableName);

        try {
            jdbc.execute(createTableSQL);
            tableExistenceCache.add(cacheKey);
        } catch (Exception e) {
            log.error("Failed to create table for {}", cacheKey, e);
            throw e;
        }
    }

    @Transactional
    public AttendanceBulkResponseDTO saveAttendance(AttendanceEntryRequestDTO request) {
        JdbcTemplate jdbc = getJdbcTemplate(request.getSchoolId());
        String tableName = getTableName(request.getAcademicYear());

        ensureAttendanceTableExists(jdbc, request.getSchoolId(), request.getAcademicYear());

        List<Object[]> batchInsertArgs = new ArrayList<>();
        List<Object[]> batchUpdateArgs = new ArrayList<>();

        String existingCheckSql = String.format("SELECT student_id FROM %s WHERE school_id=? AND academic_year=? AND standard=? AND section=? AND attendance_date=?", tableName);

        List<Long> existingStudentIds = jdbc.query(existingCheckSql,
                (rs, rowNum) -> rs.getLong("student_id"),
                request.getSchoolId(), request.getAcademicYear(), request.getStandard(), request.getSection(), request.getAttendanceDate()
        );

        Set<Long> existingSet = new HashSet<>(existingStudentIds);

        for (AttendanceEntryRequestDTO.AttendanceRecordDTO record : request.getAttendanceRecords()) {
            if (existingSet.contains(record.getStudentId())) {
                batchUpdateArgs.add(new Object[]{
                        record.getAttendanceStatus(),
                        record.getStudentId(), request.getAttendanceDate(), request.getAcademicYear(), request.getSchoolId()
                });
            } else {
                batchInsertArgs.add(new Object[]{
                        request.getSchoolId(), request.getAcademicYear(),
                        record.getStandard(), record.getSection(),
                        request.getAttendanceDate(), record.getStudentId(),
                        record.getAdmissionNumber(), record.getStudentName(),
                        record.getAttendanceStatus()
                });
            }
        }

        int recordsSaved = 0;
        int recordsUpdated = 0;

        if (!batchInsertArgs.isEmpty()) {
            String insertSQL = String.format("INSERT INTO %s (school_id, academic_year, standard, section, attendance_date, student_id, admission_number, student_name, attendance_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", tableName);
            recordsSaved = Arrays.stream(jdbc.batchUpdate(insertSQL, batchInsertArgs)).sum();
        }

        if (!batchUpdateArgs.isEmpty()) {
            String updateSQL = String.format("UPDATE %s SET attendance_status = ? WHERE student_id = ? AND attendance_date = ? AND academic_year = ? AND school_id = ?", tableName);
            recordsUpdated = Arrays.stream(jdbc.batchUpdate(updateSQL, batchUpdateArgs)).sum();
        }

        return AttendanceBulkResponseDTO.builder()
                .success(true)
                .message("Processed successfully")
                .recordsProcessed(request.getAttendanceRecords().size())
                .recordsSaved(recordsSaved)
                .recordsUpdated(recordsUpdated)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // --- UPDATED VIEW METHOD (PERIODICAL & ADMISSION NO) ---
    public List<AttendanceEntryResponseDTO> getAttendanceByCriteria(String schoolId, String academicYear, String standard, String section, String admissionNumber, LocalDate fromDate, LocalDate toDate) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String tableName = getTableName(academicYear);

        if (!tableExistenceCache.contains(schoolId + "_" + academicYear)) {
            try {
                jdbc.queryForObject("SELECT 1 FROM " + tableName + " LIMIT 1", Integer.class);
                tableExistenceCache.add(schoolId + "_" + academicYear);
            } catch (Exception e) {
                return new ArrayList<>();
            }
        }

        // Dynamic SQL Generation
        // Using BETWEEN for date range
        StringBuilder sql = new StringBuilder("SELECT * FROM " + tableName + " WHERE school_id = ? AND academic_year = ? AND attendance_date BETWEEN ? AND ?");
        List<Object> params = new ArrayList<>();
        params.add(schoolId);
        params.add(academicYear);
        params.add(fromDate);
        params.add(toDate);

        // Filter by Admission Number if provided
        if (admissionNumber != null && !admissionNumber.trim().isEmpty()) {
            sql.append(" AND admission_number = ?");
            params.add(admissionNumber.trim());
        }

        // Apply Class/Section filters if they are not "All"
        if (!"All".equalsIgnoreCase(standard)) {
            sql.append(" AND standard = ?");
            params.add(standard);
        }
        if (!"All".equalsIgnoreCase(section)) {
            sql.append(" AND section = ?");
            params.add(section);
        }

        sql.append(" ORDER BY attendance_date DESC, student_name ASC");

        return jdbc.query(sql.toString(), new BeanPropertyRowMapper<>(AttendanceEntryResponseDTO.class), params.toArray());
    }

    public Map<String, Object> getAttendanceStatistics(String schoolId, String academicYear, String standard, String section, LocalDate date) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String tableName = getTableName(academicYear);

        try {
            String sql = String.format("""
                SELECT 
                    COUNT(*) as total_records,
                    SUM(attendance_status = 'P') as present_count,
                    SUM(attendance_status = 'A') as absent_count,
                    SUM(attendance_status = 'L') as late_count,
                    SUM(attendance_status = 'H') as half_day_count,
                    COUNT(DISTINCT student_id) as unique_students
                FROM %s 
                WHERE school_id = ? AND academic_year = ? AND standard = ? AND section = ? AND attendance_date = ?
            """, tableName);

            return jdbc.queryForMap(sql, schoolId, academicYear, standard, section, date);
        } catch (Exception e) {
            return Map.of("total_records", 0, "present_count", 0, "absent_count", 0);
        }
    }

    // --- Student Profile for TC/Certificate (Updated for Late/Half Day) ---
    public Map<String, Object> getStudentAttendanceProfile(String schoolId, String academicYear, Long studentId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String tableName = getTableName(academicYear);

        try {
            // Need to verify table exists first
            if (!tableExistenceCache.contains(schoolId + "_" + academicYear)) {
                try {
                    jdbc.queryForObject("SELECT 1 FROM " + tableName + " LIMIT 1", Integer.class);
                    tableExistenceCache.add(schoolId + "_" + academicYear);
                } catch (Exception e) {
                    return Map.of("totalWorkingDays", 0);
                }
            }

            // Updated Query to get counts for P, L, H, A individually
            String sql = String.format("""
                SELECT 
                    COUNT(*) as totalWorkingDays,
                    SUM(CASE WHEN attendance_status = 'P' THEN 1 ELSE 0 END) as countPresent,
                    SUM(CASE WHEN attendance_status = 'L' THEN 1 ELSE 0 END) as countLate,
                    SUM(CASE WHEN attendance_status = 'H' THEN 1 ELSE 0 END) as countHalfDay,
                    SUM(CASE WHEN attendance_status = 'A' THEN 1 ELSE 0 END) as countAbsent
                FROM %s
                WHERE school_id = ? AND academic_year = ? AND student_id = ?
            """, tableName);

            Map<String, Object> stats = jdbc.queryForMap(sql, schoolId, academicYear, studentId);

            // Fetch Raw Counts
            long total = ((Number) stats.getOrDefault("totalWorkingDays", 0)).longValue();
            long p = ((Number) stats.getOrDefault("countPresent", 0)).longValue();
            long l = ((Number) stats.getOrDefault("countLate", 0)).longValue();
            long h = ((Number) stats.getOrDefault("countHalfDay", 0)).longValue();

            // Calculate Effective Present Days
            // Present (P) = 1, Late (L) = 1, Half Day (H) = 0.5
            double effectivePresent = p + l + (h * 0.5);

            // Calculate Percentage
            double percentage = total > 0 ? (effectivePresent / total * 100.0) : 0.0;

            stats.put("percentage", Math.round(percentage * 100.0) / 100.0);
            stats.put("effectivePresent", effectivePresent); // Added for reference

            return stats;
        } catch (Exception e) {
            log.error("Error fetching student profile", e);
            return Map.of("error", "Data unavailable");
        }
    }

    public AttendanceCheckResponseDTO checkExistingAttendance(String schoolId, String academicYear, Long studentId, LocalDate date) {
        return AttendanceCheckResponseDTO.builder().exists(false).build();
    }
}