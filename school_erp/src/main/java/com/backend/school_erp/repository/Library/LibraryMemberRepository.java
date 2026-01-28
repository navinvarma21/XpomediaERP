package com.backend.school_erp.repository.Library;

import com.backend.school_erp.entity.Library.LibraryMember;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class LibraryMemberRepository {

    // Remove JdbcTemplate injection - we'll create it dynamically per school

    public LibraryMemberRepository() {
        // Constructor without JdbcTemplate
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        // Create JdbcTemplate dynamically for each school database
        return new JdbcTemplate(createDataSource(schoolId));
    }

    private javax.sql.DataSource createDataSource(String schoolId) {
        com.zaxxer.hikari.HikariConfig config = new com.zaxxer.hikari.HikariConfig();
        config.setJdbcUrl("jdbc:mysql://localhost:3306/" + schoolId + "?useSSL=false&allowPublicKeyRetrieval=true");
        config.setUsername("root");
        config.setPassword("MySQL@3306");
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setMaxLifetime(1800000);
        config.setConnectionTimeout(10000);
        return new com.zaxxer.hikari.HikariDataSource(config);
    }

    public void ensureTableExists(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String sql = """
            CREATE TABLE IF NOT EXISTS library_members (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                admission_number VARCHAR(50) NOT NULL,
                student_name VARCHAR(255) NOT NULL,
                standard VARCHAR(50) NOT NULL,
                section VARCHAR(50) NOT NULL,
                father_name VARCHAR(255),
                phone_number VARCHAR(20),
                email VARCHAR(100),
                membership_id VARCHAR(100) NOT NULL UNIQUE,
                membership_start_date DATE NOT NULL,
                membership_end_date DATE NOT NULL,
                membership_status VARCHAR(20) DEFAULT 'ACTIVE',
                max_books_allowed INT DEFAULT 3,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_member (admission_number, school_id, academic_year)
            )
        """;
        jdbc.execute(sql);
    }

    public LibraryMember save(LibraryMember member, String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = """
            INSERT INTO library_members 
            (admission_number, student_name, standard, section, father_name, 
             phone_number, email, membership_id, membership_start_date, 
             membership_end_date, membership_status, max_books_allowed, school_id, academic_year) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        jdbc.update(sql,
                member.getAdmissionNumber(),
                member.getStudentName(),
                member.getStandard(),
                member.getSection(),
                member.getFatherName(),
                member.getPhoneNumber(),
                member.getEmail(),
                member.getMembershipId(),
                member.getMembershipStartDate(),
                member.getMembershipEndDate(),
                member.getMembershipStatus(),
                member.getMaxBooksAllowed(),
                schoolId,
                member.getAcademicYear()
        );

        return findById(jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class), schoolId)
                .orElseThrow(() -> new RuntimeException("Failed to save library member"));
    }

    public Optional<LibraryMember> findById(Long id, String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = "SELECT * FROM library_members WHERE id = ? AND school_id = ?";
        List<LibraryMember> results = jdbc.query(sql, new LibraryMemberRowMapper(), id, schoolId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<LibraryMember> findBySchoolIdAndAcademicYear(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = "SELECT * FROM library_members WHERE school_id = ? AND academic_year = ? ORDER BY created_at DESC";
        return jdbc.query(sql, new LibraryMemberRowMapper(), schoolId, academicYear);
    }

    public Optional<LibraryMember> findByAdmissionNumber(String admissionNumber, String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = "SELECT * FROM library_members WHERE admission_number = ? AND school_id = ? AND academic_year = ?";
        List<LibraryMember> results = jdbc.query(sql, new LibraryMemberRowMapper(), admissionNumber, schoolId, academicYear);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<LibraryMember> findExpiringMembers(int daysBeforeExpiry, String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = """
            SELECT * FROM library_members 
            WHERE school_id = ? AND membership_status = 'ACTIVE' 
            AND membership_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        """;
        return jdbc.query(sql, new LibraryMemberRowMapper(), schoolId, daysBeforeExpiry);
    }

    public List<LibraryMember> findExpiredMembers(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = """
            SELECT * FROM library_members 
            WHERE school_id = ? AND membership_status = 'ACTIVE' 
            AND membership_end_date < CURDATE()
        """;
        return jdbc.query(sql, new LibraryMemberRowMapper(), schoolId);
    }

    public void updateMembershipStatus(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        // Update expired members
        String expireSql = """
            UPDATE library_members 
            SET membership_status = 'EXPIRED' 
            WHERE school_id = ? AND membership_status = 'ACTIVE' 
            AND membership_end_date < CURDATE()
        """;
        jdbc.update(expireSql, schoolId);
    }

    public LibraryMember update(LibraryMember member, String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = """
            UPDATE library_members 
            SET student_name = ?, standard = ?, section = ?, father_name = ?,
                phone_number = ?, email = ?, membership_start_date = ?, 
                membership_end_date = ?, membership_status = ?, max_books_allowed = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND school_id = ?
        """;

        int rows = jdbc.update(sql,
                member.getStudentName(),
                member.getStandard(),
                member.getSection(),
                member.getFatherName(),
                member.getPhoneNumber(),
                member.getEmail(),
                member.getMembershipStartDate(),
                member.getMembershipEndDate(),
                member.getMembershipStatus(),
                member.getMaxBooksAllowed(),
                member.getId(),
                schoolId
        );

        if (rows == 0) {
            throw new RuntimeException("Member not found with id: " + member.getId());
        }

        return findById(member.getId(), schoolId)
                .orElseThrow(() -> new RuntimeException("Failed to update library member"));
    }

    public void delete(Long id, String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = "DELETE FROM library_members WHERE id = ? AND school_id = ?";
        int rows = jdbc.update(sql, id, schoolId);

        if (rows == 0) {
            throw new RuntimeException("Member not found with id: " + id);
        }
    }

    public boolean existsByAdmissionNumber(String admissionNumber, String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = "SELECT COUNT(*) FROM library_members WHERE admission_number = ? AND school_id = ? AND academic_year = ?";
        Integer count = jdbc.queryForObject(sql, Integer.class, admissionNumber, schoolId, academicYear);
        return count != null && count > 0;
    }

    private static class LibraryMemberRowMapper implements RowMapper<LibraryMember> {
        @Override
        public LibraryMember mapRow(ResultSet rs, int rowNum) throws SQLException {
            return LibraryMember.builder()
                    .id(rs.getLong("id"))
                    .admissionNumber(rs.getString("admission_number"))
                    .studentName(rs.getString("student_name"))
                    .standard(rs.getString("standard"))
                    .section(rs.getString("section"))
                    .fatherName(rs.getString("father_name"))
                    .phoneNumber(rs.getString("phone_number"))
                    .email(rs.getString("email"))
                    .membershipId(rs.getString("membership_id"))
                    .membershipStartDate(rs.getDate("membership_start_date").toLocalDate())
                    .membershipEndDate(rs.getDate("membership_end_date").toLocalDate())
                    .membershipStatus(rs.getString("membership_status"))
                    .maxBooksAllowed(rs.getInt("max_books_allowed"))
                    .schoolId(rs.getString("school_id"))
                    .academicYear(rs.getString("academic_year"))
                    .createdAt(rs.getTimestamp("created_at").toLocalDateTime().toLocalDate())
                    .updatedAt(rs.getTimestamp("updated_at").toLocalDateTime().toLocalDate())
                    .build();
        }
    }
}