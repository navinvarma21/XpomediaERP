package com.backend.school_erp.service.AdmissionMaster;

import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.AdmissionMaster.StudentRegisterReport;
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
public class StudentReportService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating DataSource for school: {}", id);
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

    private String getAdmissionTableName(String academicYear) {
        String sanitizedYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        return "admissions_" + sanitizedYear;
    }

    // Custom RowMapper to handle field mapping
    private class StudentRegisterReportRowMapper extends BeanPropertyRowMapper<StudentRegisterReport> {
        public StudentRegisterReportRowMapper() {
            super(StudentRegisterReport.class);
        }

        @Override
        public StudentRegisterReport mapRow(ResultSet rs, int rowNumber) throws SQLException {
            StudentRegisterReport report = new StudentRegisterReport();

            // Map fields with correct column names
            report.setId(rs.getLong("id"));
            report.setAdmissionNumber(rs.getString("admission_number"));
            report.setDateOfAdmission(rs.getDate("date_of_admission") != null ?
                    rs.getDate("date_of_admission").toLocalDate() : null);
            report.setStudentName(rs.getString("student_name"));
            report.setGender(rs.getString("gender"));
            report.setFatherName(rs.getString("father_name"));
            report.setMotherName(rs.getString("mother_name"));
            report.setPhoneNumber(rs.getString("phone_number"));
            report.setStandard(rs.getString("standard"));
            report.setSection(rs.getString("section"));
            report.setStreetVillage(rs.getString("street_village"));
            report.setPlacePincode(rs.getString("place_pincode"));
            report.setDistrict(rs.getString("district"));
            report.setState(rs.getString("state"));
            report.setEmailId(rs.getString("email_id"));
            report.setBusRouteNumber(rs.getString("bus_route_number"));
            report.setDateOfBirth(rs.getDate("date_of_birth") != null ?
                    rs.getDate("date_of_birth").toLocalDate() : null);
            report.setEmisNumber(rs.getString("emis"));
            report.setAadharNumber(rs.getString("aadhar_number"));
            report.setSchoolId(rs.getString("school_id"));
            report.setAcademicYear(rs.getString("academic_year"));
            report.setCreatedAt(rs.getTimestamp("created_at") != null ?
                    rs.getTimestamp("created_at").toLocalDateTime() : null);
            report.setUpdatedAt(rs.getTimestamp("updated_at") != null ?
                    rs.getTimestamp("updated_at").toLocalDateTime() : null);

            return report;
        }
    }

    // For Aadhaar EMIS report with all required fields
    @Transactional(readOnly = true)
    public List<StudentRegisterReport> getAllStudentsForAadhaarEmisReport(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        try {
            String tableName = getAdmissionTableName(academicYear);

            // Check if table exists
            if (!tableExists(jdbc, tableName)) {
                log.warn("Table {} does not exist for school: {}", tableName, schoolId);
                return List.of();
            }

            String sql = String.format("""
                SELECT 
                    id,
                    admission_number,
                    date_of_admission,
                    student_name,
                    gender,
                    father_name,
                    mother_name,
                    phone_number,
                    standard,
                    section,
                    street_village,
                    place_pincode,
                    district,
                    state,
                    email_id,
                    bus_route_number,
                    date_of_birth,
                    emis,
                    aadhar_number,
                    school_id,
                    academic_year,
                    created_at,
                    updated_at
                FROM %s 
                WHERE school_id = ? AND academic_year = ?
                ORDER BY standard, section, student_name
            """, tableName);

            log.info("📊 Fetching students for Aadhaar EMIS report - school: {}, academic year: {}", schoolId, academicYear);

            List<StudentRegisterReport> students = jdbc.query(sql,
                    new StudentRegisterReportRowMapper(),
                    schoolId, academicYear);

            log.info("✅ Found {} students for Aadhaar EMIS report", students.size());
            return students;

        } catch (Exception e) {
            log.error("❌ Error fetching students for Aadhaar EMIS report - school: {} and academic year: {}",
                    schoolId, academicYear, e);
            throw new RuntimeException("Failed to fetch students for Aadhaar EMIS report: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<StudentRegisterReport> getAllStudentRegisterData(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        try {
            String tableName = getAdmissionTableName(academicYear);

            // Check if table exists
            if (!tableExists(jdbc, tableName)) {
                log.warn("Table {} does not exist for school: {}", tableName, schoolId);
                return List.of();
            }

            String sql = String.format("""
                SELECT 
                    id,
                    admission_number,
                    date_of_admission,
                    student_name,
                    gender,
                    father_name,
                    mother_name,
                    phone_number,
                    standard,
                    section,
                    street_village,
                    place_pincode,
                    district,
                    state,
                    email_id,
                    bus_route_number,
                    date_of_birth,
                    emis,
                    aadhar_number,
                    school_id,
                    academic_year,
                    created_at,
                    updated_at
                FROM %s 
                WHERE school_id = ? AND academic_year = ?
                ORDER BY standard, section, student_name
            """, tableName);

            log.info("📊 Fetching student register data for school: {}, academic year: {}", schoolId, academicYear);

            List<StudentRegisterReport> students = jdbc.query(sql,
                    new StudentRegisterReportRowMapper(),
                    schoolId, academicYear);

            log.info("✅ Found {} students for register report", students.size());
            return students;

        } catch (Exception e) {
            log.error("❌ Error fetching student register data for school: {} and academic year: {}",
                    schoolId, academicYear, e);
            throw new RuntimeException("Failed to fetch student register data: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<StudentRegisterReport> getStudentRegisterDataByStandard(String schoolId, String academicYear, String standard) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        try {
            String tableName = getAdmissionTableName(academicYear);

            if (!tableExists(jdbc, tableName)) {
                log.warn("Table {} does not exist for school: {}", tableName, schoolId);
                return List.of();
            }

            String sql = String.format("""
                SELECT 
                    id,
                    admission_number,
                    date_of_admission,
                    student_name,
                    gender,
                    father_name,
                    mother_name,
                    phone_number,
                    standard,
                    section,
                    street_village,
                    place_pincode,
                    district,
                    state,
                    email_id,
                    bus_route_number,
                    date_of_birth,
                    emis,
                    aadhar_number,
                    school_id,
                    academic_year,
                    created_at,
                    updated_at
                FROM %s 
                WHERE school_id = ? AND academic_year = ? AND standard = ?
                ORDER BY section, student_name
            """, tableName);

            log.info("📊 Fetching student register data for standard: {}, school: {}, academic year: {}",
                    standard, schoolId, academicYear);

            List<StudentRegisterReport> students = jdbc.query(sql,
                    new StudentRegisterReportRowMapper(),
                    schoolId, academicYear, standard);

            log.info("✅ Found {} students for standard {} in register report", students.size(), standard);
            return students;

        } catch (Exception e) {
            log.error("❌ Error fetching student register data for standard: {}, school: {}, academic year: {}",
                    standard, schoolId, academicYear, e);
            throw new RuntimeException("Failed to fetch student register data by standard: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<StudentRegisterReport> searchStudentRegisterData(String schoolId, String academicYear, String searchTerm) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        try {
            String tableName = getAdmissionTableName(academicYear);

            if (!tableExists(jdbc, tableName)) {
                log.warn("Table {} does not exist for school: {}", tableName, schoolId);
                return List.of();
            }

            String likeTerm = "%" + searchTerm + "%";
            String sql = String.format("""
                SELECT 
                    id,
                    admission_number,
                    date_of_admission,
                    student_name,
                    gender,
                    father_name,
                    mother_name,
                    phone_number,
                    standard,
                    section,
                    street_village,
                    place_pincode,
                    district,
                    state,
                    email_id,
                    bus_route_number,
                    date_of_birth,
                    emis,
                    aadhar_number,
                    school_id,
                    academic_year,
                    created_at,
                    updated_at
                FROM %s 
                WHERE school_id = ? AND academic_year = ?
                AND (admission_number LIKE ? 
                     OR student_name LIKE ? 
                     OR father_name LIKE ? 
                     OR mother_name LIKE ?
                     OR phone_number LIKE ?
                     OR standard LIKE ?)
                ORDER BY standard, section, student_name
            """, tableName);

            log.info("🔍 Searching student register data for term: {}, school: {}, academic year: {}",
                    searchTerm, schoolId, academicYear);

            List<StudentRegisterReport> students = jdbc.query(sql,
                    new StudentRegisterReportRowMapper(),
                    schoolId, academicYear, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm);

            log.info("✅ Found {} students matching search term '{}'", students.size(), searchTerm);
            return students;

        } catch (Exception e) {
            log.error("❌ Error searching student register data for term: {}, school: {}, academic year: {}",
                    searchTerm, schoolId, academicYear, e);
            throw new RuntimeException("Failed to search student register data: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<String> getAvailableStandards(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        try {
            String tableName = getAdmissionTableName(academicYear);

            if (!tableExists(jdbc, tableName)) {
                log.warn("Table {} does not exist for school: {}", tableName, schoolId);
                return List.of();
            }

            String sql = String.format("""
                SELECT DISTINCT standard 
                FROM %s 
                WHERE school_id = ? AND academic_year = ? 
                ORDER BY standard
            """, tableName);

            log.info("📊 Fetching available standards for school: {}, academic year: {}", schoolId, academicYear);

            List<String> standards = jdbc.queryForList(sql, String.class, schoolId, academicYear);

            log.info("✅ Found {} available standards", standards.size());
            return standards;

        } catch (Exception e) {
            log.error("❌ Error fetching available standards for school: {} and academic year: {}",
                    schoolId, academicYear, e);
            throw new RuntimeException("Failed to fetch available standards: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentRegisterStatistics(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        try {
            String tableName = getAdmissionTableName(academicYear);

            if (!tableExists(jdbc, tableName)) {
                log.warn("Table {} does not exist for school: {}", tableName, schoolId);
                return Map.of("totalStudents", 0, "standardsCount", 0);
            }

            // Total students count
            String totalSql = String.format("""
                SELECT COUNT(*) FROM %s 
                WHERE school_id = ? AND academic_year = ?
            """, tableName);

            Integer totalStudents = jdbc.queryForObject(totalSql, Integer.class, schoolId, academicYear);

            // Standards count
            String standardsSql = String.format("""
                SELECT COUNT(DISTINCT standard) FROM %s 
                WHERE school_id = ? AND academic_year = ?
            """, tableName);

            Integer standardsCount = jdbc.queryForObject(standardsSql, Integer.class, schoolId, academicYear);

            // Gender distribution
            String genderSql = String.format("""
                SELECT gender, COUNT(*) as count 
                FROM %s 
                WHERE school_id = ? AND academic_year = ? 
                GROUP BY gender
            """, tableName);

            Map<String, Integer> genderDistribution = jdbc.query(genderSql,
                    rs -> {
                        Map<String, Integer> result = new java.util.HashMap<>();
                        while (rs.next()) {
                            result.put(rs.getString("gender"), rs.getInt("count"));
                        }
                        return result;
                    }, schoolId, academicYear);

            Map<String, Object> statistics = new java.util.HashMap<>();
            statistics.put("totalStudents", totalStudents != null ? totalStudents : 0);
            statistics.put("standardsCount", standardsCount != null ? standardsCount : 0);
            statistics.put("genderDistribution", genderDistribution);
            statistics.put("academicYear", academicYear);
            statistics.put("schoolId", schoolId);

            log.info("📈 Student register statistics: {}", statistics);
            return statistics;

        } catch (Exception e) {
            log.error("❌ Error fetching student register statistics for school: {} and academic year: {}",
                    schoolId, academicYear, e);
            throw new RuntimeException("Failed to fetch student register statistics: " + e.getMessage(), e);
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