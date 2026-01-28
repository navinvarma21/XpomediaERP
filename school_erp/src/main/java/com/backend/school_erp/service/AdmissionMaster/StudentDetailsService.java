package com.backend.school_erp.service.AdmissionMaster;

import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.AdmissionMaster.StudentDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class StudentDetailsService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating DataSource for school: {}", id);
            HikariConfig config = new HikariConfig();
            // Ensure your DB connection string is correct
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

    private String getAdmissionTableName(String academicYear) {
        // Converts "2025-2026" -> "admissions_2025_2026"
        String sanitizedYear = academicYear.replaceAll("-", "_");
        return "admissions_" + sanitizedYear;
    }

    private String getTuitionFeeTableName(String academicYear) {
        String sanitizedYear = academicYear.replaceAll("-", "_");
        return "tuition_fees_" + sanitizedYear;
    }

    private String getHostelFeeTableName(String academicYear) {
        String sanitizedYear = academicYear.replaceAll("-", "_");
        return "hostel_fees_" + sanitizedYear;
    }

    private String getTransportFeeTableName(String academicYear) {
        String sanitizedYear = academicYear.replaceAll("-", "_");
        return "transport_fees_" + sanitizedYear;
    }

    // Custom RowMapper to ensure EMIS, Aadhar, and Fees are mapped correctly
    private static class StudentDetailsRowMapper extends BeanPropertyRowMapper<StudentDetails> {
        public StudentDetailsRowMapper() {
            super(StudentDetails.class);
        }

        @Override
        public StudentDetails mapRow(ResultSet rs, int rowNumber) throws SQLException {
            StudentDetails student = super.mapRow(rs, rowNumber);
            // Explicitly ensure camelCase mapping if automatic mapping fails
            if (student != null) {
                student.setEmis(rs.getString("emis"));
                student.setAadharNumber(rs.getString("aadhar_number"));

                // Map the calculated fee columns to the transient fields in Entity
                // We use getDouble which returns 0.0 if NULL, preventing NullPointerExceptions
                student.setTuitionFee(rs.getDouble("tuition_fee"));
                student.setHostelFee(rs.getDouble("hostel_fee"));
                student.setTransportFee(rs.getDouble("transport_fee"));
            }
            return student;
        }
    }

    @Transactional(readOnly = true)
    public List<StudentDetails> getAllStudentDetails(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String admissionTable = getAdmissionTableName(academicYear);
        String tuitionTable = getTuitionFeeTableName(academicYear);
        String hostelTable = getHostelFeeTableName(academicYear);
        String transportTable = getTransportFeeTableName(academicYear);

        try {
            if (!tableExists(jdbc, admissionTable)) {
                log.warn("Table {} does not exist for school: {}", admissionTable, schoolId);
                return List.of();
            }

            // Enhanced SQL: Fetches student details AND calculates total fees per category in one query
            // Uses COALESCE to return 0 instead of NULL if no fees exist
            String sql = String.format("""
                SELECT a.*,
                    (SELECT COALESCE(SUM(amount), 0) FROM %s WHERE admission_number = a.admission_number) AS tuition_fee,
                    (SELECT COALESCE(SUM(amount), 0) FROM %s WHERE admission_number = a.admission_number) AS hostel_fee,
                    (SELECT COALESCE(SUM(amount), 0) FROM %s WHERE admission_number = a.admission_number) AS transport_fee
                FROM %s a 
                WHERE a.school_id = ? AND a.academic_year = ? 
                ORDER BY a.standard, a.section, a.student_name
                """, tuitionTable, hostelTable, transportTable, admissionTable);

            return jdbc.query(sql, new StudentDetailsRowMapper(), schoolId, academicYear);

        } catch (Exception e) {
            log.error("❌ Error fetching student details with fees: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch students with fee details");
        }
    }

    @Transactional(readOnly = true)
    public StudentDetails getStudentByAdmissionNumber(String schoolId, String admissionNumber, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String admissionTable = getAdmissionTableName(academicYear);
        String tuitionTable = getTuitionFeeTableName(academicYear);
        String hostelTable = getHostelFeeTableName(academicYear);
        String transportTable = getTransportFeeTableName(academicYear);

        try {
            if (!tableExists(jdbc, admissionTable)) return null;

            // Enhanced SQL for single student with fee calculation
            String sql = String.format("""
                SELECT a.*,
                    (SELECT COALESCE(SUM(amount), 0) FROM %s WHERE admission_number = a.admission_number) AS tuition_fee,
                    (SELECT COALESCE(SUM(amount), 0) FROM %s WHERE admission_number = a.admission_number) AS hostel_fee,
                    (SELECT COALESCE(SUM(amount), 0) FROM %s WHERE admission_number = a.admission_number) AS transport_fee
                FROM %s a 
                WHERE a.school_id = ? AND a.academic_year = ? AND a.admission_number = ? 
                LIMIT 1
                """, tuitionTable, hostelTable, transportTable, admissionTable);

            List<StudentDetails> students = jdbc.query(sql, new StudentDetailsRowMapper(), schoolId, academicYear, admissionNumber);

            if (students.isEmpty()) {
                return null;
            }

            return students.get(0);

        } catch (Exception e) {
            log.error("❌ Error fetching student {} with fees: {}", admissionNumber, e.getMessage());
            throw new RuntimeException("Failed to fetch student details");
        }
    }

    private boolean tableExists(JdbcTemplate jdbc, String tableName) {
        try {
            jdbc.queryForObject("SELECT 1 FROM " + tableName + " LIMIT 1", Integer.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}