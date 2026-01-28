package com.backend.school_erp.repository.Library;

import com.backend.school_erp.entity.Library.LibraryBookIssue;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class LibraryBookIssueRepository {

    public LibraryBookIssueRepository() {
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
            CREATE TABLE IF NOT EXISTS library_book_issues (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                admission_number VARCHAR(50) NOT NULL,
                student_name VARCHAR(255) NOT NULL,
                standard VARCHAR(50) NOT NULL,
                section VARCHAR(50) NOT NULL,
                membership_id VARCHAR(100) NOT NULL,
                
                book_id VARCHAR(50) NOT NULL,
                book_title VARCHAR(255) NOT NULL,
                author_name VARCHAR(255),
                isbn VARCHAR(20),
                
                issued_date DATE NOT NULL,
                due_date DATE NOT NULL,
                returned_date DATE,
                status VARCHAR(20) DEFAULT 'ISSUED',
                
                fine_amount DECIMAL(10,2) DEFAULT 0.0,
                remarks TEXT,
                
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_member (admission_number, school_id, academic_year),
                INDEX idx_book (book_id, school_id, academic_year),
                INDEX idx_status (status, school_id)
            )
        """;
        jdbc.execute(sql);
    }

    public LibraryBookIssue save(LibraryBookIssue issue, String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = """
            INSERT INTO library_book_issues 
            (admission_number, student_name, standard, section, membership_id,
             book_id, book_title, author_name, isbn,
             issued_date, due_date, returned_date, status,
             fine_amount, remarks, school_id, academic_year) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        jdbc.update(sql,
                issue.getAdmissionNumber(),
                issue.getStudentName(),
                issue.getStandard(),
                issue.getSection(),
                issue.getMembershipId(),
                issue.getBookId(),
                issue.getBookTitle(),
                issue.getAuthorName(),
                issue.getIsbn(),
                issue.getIssuedDate(),
                issue.getDueDate(),
                issue.getReturnedDate(),
                issue.getStatus(),
                issue.getFineAmount(),
                issue.getRemarks(),
                schoolId,
                issue.getAcademicYear()
        );

        return findById(jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class), schoolId)
                .orElseThrow(() -> new RuntimeException("Failed to save book issue record"));
    }

    public Optional<LibraryBookIssue> findById(Long id, String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = "SELECT * FROM library_book_issues WHERE id = ? AND school_id = ?";
        List<LibraryBookIssue> results = jdbc.query(sql, new LibraryBookIssueRowMapper(), id, schoolId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<LibraryBookIssue> findBySchoolIdAndAcademicYear(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = "SELECT * FROM library_book_issues WHERE school_id = ? AND academic_year = ? ORDER BY issued_date DESC";
        return jdbc.query(sql, new LibraryBookIssueRowMapper(), schoolId, academicYear);
    }

    public List<LibraryBookIssue> findByAdmissionNumber(String admissionNumber, String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = "SELECT * FROM library_book_issues WHERE admission_number = ? AND school_id = ? AND academic_year = ? ORDER BY issued_date DESC";
        return jdbc.query(sql, new LibraryBookIssueRowMapper(), admissionNumber, schoolId, academicYear);
    }

    public List<LibraryBookIssue> findIssuedBooks(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = "SELECT * FROM library_book_issues WHERE school_id = ? AND academic_year = ? AND status = 'ISSUED' ORDER BY due_date ASC";
        return jdbc.query(sql, new LibraryBookIssueRowMapper(), schoolId, academicYear);
    }

    public List<LibraryBookIssue> findOverdueBooks(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = "SELECT * FROM library_book_issues WHERE school_id = ? AND status = 'ISSUED' AND due_date < CURDATE()";
        return jdbc.query(sql, new LibraryBookIssueRowMapper(), schoolId);
    }

    public LibraryBookIssue update(LibraryBookIssue issue, String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = """
            UPDATE library_book_issues 
            SET returned_date = ?, status = ?, fine_amount = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND school_id = ?
        """;

        int rows = jdbc.update(sql,
                issue.getReturnedDate(),
                issue.getStatus(),
                issue.getFineAmount(),
                issue.getRemarks(),
                issue.getId(),
                schoolId
        );

        if (rows == 0) {
            throw new RuntimeException("Book issue record not found with id: " + issue.getId());
        }

        return findById(issue.getId(), schoolId)
                .orElseThrow(() -> new RuntimeException("Failed to update book issue record"));
    }

    public void updateOverdueStatus(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = """
            UPDATE library_book_issues 
            SET status = 'OVERDUE' 
            WHERE school_id = ? AND status = 'ISSUED' AND due_date < CURDATE()
        """;
        jdbc.update(sql, schoolId);
    }

    public int countIssuedBooksByMember(String admissionNumber, String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = "SELECT COUNT(*) FROM library_book_issues WHERE admission_number = ? AND school_id = ? AND academic_year = ? AND status = 'ISSUED'";
        Integer count = jdbc.queryForObject(sql, Integer.class, admissionNumber, schoolId, academicYear);
        return count != null ? count : 0;
    }

    public boolean isBookIssued(String bookId, String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(schoolId);

        String sql = "SELECT COUNT(*) FROM library_book_issues WHERE book_id = ? AND school_id = ? AND academic_year = ? AND status = 'ISSUED'";
        Integer count = jdbc.queryForObject(sql, Integer.class, bookId, schoolId, academicYear);
        return count != null && count > 0;
    }

    private static class LibraryBookIssueRowMapper implements RowMapper<LibraryBookIssue> {
        @Override
        public LibraryBookIssue mapRow(ResultSet rs, int rowNum) throws SQLException {
            return LibraryBookIssue.builder()
                    .id(rs.getLong("id"))
                    .admissionNumber(rs.getString("admission_number"))
                    .studentName(rs.getString("student_name"))
                    .standard(rs.getString("standard"))
                    .section(rs.getString("section"))
                    .membershipId(rs.getString("membership_id"))
                    .bookId(rs.getString("book_id"))
                    .bookTitle(rs.getString("book_title"))
                    .authorName(rs.getString("author_name"))
                    .isbn(rs.getString("isbn"))
                    .issuedDate(rs.getDate("issued_date").toLocalDate())
                    .dueDate(rs.getDate("due_date").toLocalDate())
                    .returnedDate(rs.getDate("returned_date") != null ? rs.getDate("returned_date").toLocalDate() : null)
                    .status(rs.getString("status"))
                    .fineAmount(rs.getDouble("fine_amount"))
                    .remarks(rs.getString("remarks"))
                    .schoolId(rs.getString("school_id"))
                    .academicYear(rs.getString("academic_year"))
                    .createdAt(rs.getTimestamp("created_at").toLocalDateTime().toLocalDate())
                    .updatedAt(rs.getTimestamp("updated_at").toLocalDateTime().toLocalDate())
                    .build();
        }
    }
}