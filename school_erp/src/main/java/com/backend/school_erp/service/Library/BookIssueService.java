package com.backend.school_erp.service.Library;

import com.backend.school_erp.DTO.Library.BookIssueDTO;
import com.backend.school_erp.DTO.Library.MemberDTO;
import com.backend.school_erp.DTO.Library.MemberInfoDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Library.LibraryIssueReturn;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class BookIssueService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();
    private static final int MAX_BOOKS_STUDENT = 3;
    private static final int MAX_BOOKS_STAFF = 5;
    private static final int MAX_ISSUE_DAYS = 14;
    private static final double DAILY_FINE = 5.0;

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            config.setMaximumPoolSize(10);
            config.setConnectionTimeout(30000);
            config.setIdleTimeout(600000);
            config.setMaxLifetime(1800000);
            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private String getStudentTableName(String academicYear) {
        if (academicYear == null) return "admissions";
        String sanitizedYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        return "admissions_" + sanitizedYear;
    }

    private void ensureTablesExist(JdbcTemplate jdbc) {
        // Library issue/return table
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS library_issue_returns (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                issue_no VARCHAR(100) NOT NULL UNIQUE,
                member_name VARCHAR(200),
                member_code VARCHAR(100),
                member_type VARCHAR(50),
                book_qr_code VARCHAR(200) NOT NULL,
                book_code VARCHAR(100),
                book_name VARCHAR(500),
                department_name VARCHAR(200),
                publisher_name VARCHAR(300),
                author_name VARCHAR(300),
                issue_date DATE,
                max_return_date DATE,
                actual_return_date DATE,
                status VARCHAR(50) DEFAULT 'ISSUED',
                fine_amount DECIMAL(10,2) DEFAULT 0.00,
                fine_paid DECIMAL(10,2) DEFAULT 0.00,
                remarks TEXT,
                school_id VARCHAR(100),
                academic_year VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_issue_no (issue_no),
                INDEX idx_member_code (member_code),
                INDEX idx_qr (book_qr_code),
                INDEX idx_status (status),
                INDEX idx_member_issue (member_code, status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """);

        // Sequence table
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS issue_sequence (
                id INT AUTO_INCREMENT PRIMARY KEY,
                school_id VARCHAR(100) UNIQUE,
                last_num INT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """);

        // Fine configuration table
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS library_fine_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                school_id VARCHAR(100),
                daily_fine DECIMAL(10,2) DEFAULT 5.00,
                grace_days INT DEFAULT 3,
                max_fine DECIMAL(10,2) DEFAULT 500.00,
                UNIQUE KEY uk_school (school_id)
            )
        """);
    }

    // --- 1. IMPROVED MEMBER SEARCH ---
    public List<MemberDTO> searchMembers(String searchTerm, String schoolId, String academicYear, String memberType) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        List<MemberDTO> results = new ArrayList<>();
        String term = "%" + searchTerm + "%";

        // Search Students
        if (memberType == null || "STUDENT".equalsIgnoreCase(memberType)) {
            try {
                String studentTable = getStudentTableName(academicYear);
                String checkTable = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?";
                Integer exists = jdbc.queryForObject(checkTable, Integer.class, schoolId, studentTable);

                if (exists != null && exists > 0) {
                    String studentSql = """
                        SELECT admission_number, student_name, standard, section 
                        FROM """ + studentTable + """
                        WHERE (admission_number LIKE ? OR student_name LIKE ?) 
                        AND is_active = 'Y'
                        LIMIT 20
                    """;

                    List<Map<String, Object>> students = jdbc.queryForList(studentSql, term, term);
                    for (Map<String, Object> row : students) {
                        results.add(MemberDTO.builder()
                                .memberCode((String) row.get("admission_number"))
                                .memberName((String) row.get("student_name"))
                                .memberType("STUDENT")
                                .className((String) row.get("standard"))
                                .section((String) row.get("section"))
                                .build());
                    }
                }
            } catch (Exception e) {
                log.warn("Student search error: {}", e.getMessage());
            }
        }

        // Search Staff
        if (memberType == null || "STAFF".equalsIgnoreCase(memberType)) {
            try {
                String staffSql = """
                    SELECT staff_code, name, phone, email 
                    FROM staff 
                    WHERE (staff_code LIKE ? OR name LIKE ? OR phone LIKE ?)
                    AND status = 'ACTIVE'
                    LIMIT 20
                """;

                List<Map<String, Object>> staff = jdbc.queryForList(staffSql, term, term, term);
                for (Map<String, Object> row : staff) {
                    results.add(MemberDTO.builder()
                            .memberCode((String) row.get("staff_code"))
                            .memberName((String) row.get("name"))
                            .memberType("STAFF")
                            .phone((String) row.get("phone"))
                            .email((String) row.get("email"))
                            .build());
                }
            } catch (Exception e) {
                log.warn("Staff search error: {}", e.getMessage());
            }
        }

        return results;
    }

    // --- 2. GET COMPLETE MEMBER INFO ---
    public MemberInfoDTO getMemberInfo(String memberCode, String memberType, String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        MemberInfoDTO info = new MemberInfoDTO();

        // Get basic member info
        if ("STUDENT".equals(memberType)) {
            String studentTable = getStudentTableName(academicYear);
            String studentSql = "SELECT admission_number, student_name, standard, section FROM " + studentTable + " WHERE admission_number = ?";
            Map<String, Object> student = jdbc.queryForMap(studentSql, memberCode);

            info.setMemberCode(memberCode);
            info.setMemberName((String) student.get("student_name"));
            info.setMemberType("STUDENT");
            info.setClassName((String) student.get("standard"));
            info.setSection((String) student.get("section"));
            info.setMaxBooksAllowed(MAX_BOOKS_STUDENT);

        } else if ("STAFF".equals(memberType)) {
            String staffSql = "SELECT staff_code, name, phone, email FROM staff WHERE staff_code = ?";
            Map<String, Object> staff = jdbc.queryForMap(staffSql, memberCode);

            info.setMemberCode(memberCode);
            info.setMemberName((String) staff.get("name"));
            info.setMemberType("STAFF");
            info.setPhone((String) staff.get("phone"));
            info.setEmail((String) staff.get("email"));
            info.setMaxBooksAllowed(MAX_BOOKS_STAFF);
        }

        // Get current borrowing stats
        String currentSql = """
            SELECT 
                COUNT(*) as borrowed_count,
                SUM(CASE WHEN max_return_date < CURDATE() AND status = 'ISSUED' THEN 1 ELSE 0 END) as overdue_count,
                SUM(CASE WHEN max_return_date < CURDATE() AND status = 'ISSUED' 
                    THEN DATEDIFF(CURDATE(), max_return_date) * ? ELSE 0 END) as total_fine
            FROM library_issue_returns 
            WHERE member_code = ? AND member_type = ? AND school_id = ? AND status = 'ISSUED'
        """;

        Map<String, Object> stats = jdbc.queryForMap(currentSql, DAILY_FINE, memberCode, memberType, schoolId);

        int borrowed = ((Number) stats.get("borrowed_count")).intValue();
        int overdue = ((Number) stats.get("overdue_count")).intValue();
        double totalFine = ((Number) stats.get("total_fine")).doubleValue();

        info.setCurrentlyBorrowed(borrowed);
        info.setOverdueBooks(overdue);
        info.setTotalFineDue(totalFine);
        info.setCanBorrowMore(info.getMaxBooksAllowed() - borrowed);

        // Get recent issues
        String historySql = """
            SELECT issue_no, book_name, author_name, issue_date, max_return_date, status,
                   CASE WHEN max_return_date < CURDATE() AND status = 'ISSUED' 
                        THEN DATEDIFF(CURDATE(), max_return_date) * ? ELSE 0 END as fine_due
            FROM library_issue_returns 
            WHERE member_code = ? AND member_type = ? AND school_id = ?
            ORDER BY issue_date DESC LIMIT 5
        """;

        List<Map<String, Object>> history = jdbc.queryForList(historySql, DAILY_FINE, memberCode, memberType, schoolId);
        info.setRecentIssues(history);

        return info;
    }

    // --- 3. SCAN BOOK FOR ISSUE (with validation) ---
    public Map<String, Object> scanBookForIssue(String qrCode, String schoolId, String memberCode) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        Map<String, Object> result = new HashMap<>();

        // Check book exists and is available
        String bookSql = """
            SELECT ls.*, 
                   (SELECT COUNT(*) FROM library_issue_returns 
                    WHERE book_qr_code = ls.qr_code_no AND status = 'ISSUED') as issued_count
            FROM library_stocks ls 
            WHERE ls.qr_code_no = ? AND ls.school_id = ?
        """;

        List<Map<String, Object>> books = jdbc.queryForList(bookSql, qrCode, schoolId);
        if (books.isEmpty()) {
            throw new RuntimeException("Book not found or not available in stock");
        }

        Map<String, Object> book = books.get(0);
        int quantity = ((Number) book.get("quantity")).intValue();
        int issuedCount = ((Number) book.get("issued_count")).intValue();
        int available = quantity - issuedCount;

        if (available <= 0) {
            throw new RuntimeException("This book is currently not available for issue");
        }

        // Get total quantity of this book (all copies)
        String totalSql = "SELECT SUM(quantity) as total_qty FROM library_stocks WHERE book_name = ? AND school_id = ?";
        Integer totalQty = jdbc.queryForObject(totalSql, Integer.class, book.get("book_name"), schoolId);

        // Build book info
        Map<String, Object> bookInfo = new HashMap<>();
        bookInfo.put("bookQrCode", book.get("qr_code_no"));
        bookInfo.put("bookCode", book.get("book_code"));
        bookInfo.put("bookName", book.get("book_name"));
        bookInfo.put("departmentName", book.get("department_name"));
        bookInfo.put("publisherName", book.get("publisher_name"));
        bookInfo.put("authorName", book.get("author_name"));
        bookInfo.put("totalAvailableQty", totalQty != null ? totalQty : 0);
        bookInfo.put("thisCopyAvailable", available > 0);
        bookInfo.put("availableCopies", available);

        // If memberCode provided, check if they already have this book
        if (memberCode != null && !memberCode.trim().isEmpty()) {
            String checkSql = """
                SELECT COUNT(*) FROM library_issue_returns 
                WHERE member_code = ? AND book_qr_code = ? AND status = 'ISSUED' AND school_id = ?
            """;
            Integer alreadyHas = jdbc.queryForObject(checkSql, Integer.class, memberCode, qrCode, schoolId);
            bookInfo.put("alreadyBorrowed", alreadyHas != null && alreadyHas > 0);
        }

        result.put("book", bookInfo);
        result.put("success", true);
        result.put("message", "Book available for issue");

        return result;
    }

    // --- 4. VALIDATE ISSUE REQUEST ---
    public Map<String, Object> validateIssue(BookIssueDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(dto.getSchoolId());
        Map<String, Object> validation = new HashMap<>();
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        // 1. Check member borrowing limit
        String countSql = """
            SELECT COUNT(*) FROM library_issue_returns 
            WHERE member_code = ? AND member_type = ? AND school_id = ? AND status = 'ISSUED'
        """;

        int currentBorrowed = jdbc.queryForObject(countSql, Integer.class,
                dto.getMemberCode(), dto.getMemberType(), dto.getSchoolId());

        int maxAllowed = "STUDENT".equals(dto.getMemberType()) ? MAX_BOOKS_STUDENT : MAX_BOOKS_STAFF;

        if (currentBorrowed >= maxAllowed) {
            errors.add("Member has reached maximum borrowing limit (" + maxAllowed + " books)");
        }

        // 2. Check if member has overdue books
        String overdueSql = """
            SELECT COUNT(*) FROM library_issue_returns 
            WHERE member_code = ? AND member_type = ? AND school_id = ? 
            AND status = 'ISSUED' AND max_return_date < CURDATE()
        """;

        int overdueCount = jdbc.queryForObject(overdueSql, Integer.class,
                dto.getMemberCode(), dto.getMemberType(), dto.getSchoolId());

        if (overdueCount > 0) {
            errors.add("Member has " + overdueCount + " overdue book(s). Please return them first.");
        }

        // 3. Check if book is available
        String bookSql = """
            SELECT ls.quantity, 
                   (SELECT COUNT(*) FROM library_issue_returns 
                    WHERE book_qr_code = ls.qr_code_no AND status = 'ISSUED') as issued_count
            FROM library_stocks ls 
            WHERE ls.qr_code_no = ? AND ls.school_id = ?
        """;

        Map<String, Object> bookStatus = jdbc.queryForMap(bookSql, dto.getBookQrCode(), dto.getSchoolId());
        int quantity = ((Number) bookStatus.get("quantity")).intValue();
        int issuedCount = ((Number) bookStatus.get("issued_count")).intValue();

        if (quantity <= issuedCount) {
            errors.add("This book copy is currently not available");
        }

        // 4. Check if member already has this book
        String duplicateSql = """
            SELECT COUNT(*) FROM library_issue_returns 
            WHERE member_code = ? AND book_qr_code = ? AND status = 'ISSUED' AND school_id = ?
        """;

        Integer alreadyHas = jdbc.queryForObject(duplicateSql, Integer.class,
                dto.getMemberCode(), dto.getBookQrCode(), dto.getSchoolId());

        if (alreadyHas != null && alreadyHas > 0) {
            errors.add("Member already has this book issued");
        }

        // Calculate due date
        LocalDate issueDate = dto.getIssueDate() != null ? dto.getIssueDate() : LocalDate.now();
        LocalDate dueDate = issueDate.plusDays(MAX_ISSUE_DAYS);

        validation.put("valid", errors.isEmpty());
        validation.put("errors", errors);
        validation.put("warnings", warnings);
        validation.put("maxReturnDate", dueDate);
        validation.put("canBorrowMore", maxAllowed - currentBorrowed);
        validation.put("currentlyBorrowed", currentBorrowed);

        return validation;
    }

    // --- 5. IMPROVED ISSUE BOOK ---
    @Transactional
    public Map<String, Object> issueBook(BookIssueDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(dto.getSchoolId());
        ensureTablesExist(jdbc);

        Map<String, Object> result = new HashMap<>();

        try {
            // Validate first
            Map<String, Object> validation = validateIssue(dto);
            if (!(Boolean) validation.get("valid")) {
                throw new RuntimeException(String.join(", ", (List<String>) validation.get("errors")));
            }

            // Use provided dates or default
            LocalDate issueDate = dto.getIssueDate() != null ? dto.getIssueDate() : LocalDate.now();
            LocalDate dueDate = dto.getMaxReturnDate() != null ? dto.getMaxReturnDate() :
                    issueDate.plusDays(MAX_ISSUE_DAYS);

            // Generate issue number
            Integer lastNum = null;
            try {
                lastNum = jdbc.queryForObject("SELECT last_num FROM issue_sequence WHERE school_id = ? FOR UPDATE",
                        Integer.class, dto.getSchoolId());
            } catch (Exception e) {
                // Table might not exist or no record
            }

            int nextNum = (lastNum == null) ? 1 : lastNum + 1;
            String issueNo = "LIB-" + String.format("%06d", nextNum);

            if (lastNum == null) {
                jdbc.update("INSERT INTO issue_sequence (school_id, last_num) VALUES (?, ?)",
                        dto.getSchoolId(), nextNum);
            } else {
                jdbc.update("UPDATE issue_sequence SET last_num = ? WHERE school_id = ?",
                        nextNum, dto.getSchoolId());
            }

            // Insert issue record
            String insertSql = """
                INSERT INTO library_issue_returns (
                    issue_no, member_name, member_code, member_type,
                    book_qr_code, book_code, book_name, department_name, 
                    publisher_name, author_name, issue_date, max_return_date, 
                    status, school_id, academic_year, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ISSUED', ?, ?, NOW())
            """;

            int rows = jdbc.update(insertSql,
                    issueNo, dto.getMemberName(), dto.getMemberCode(), dto.getMemberType(),
                    dto.getBookQrCode(), dto.getBookCode(), dto.getBookName(),
                    dto.getDepartmentName(), dto.getPublisherName(), dto.getAuthorName(),
                    issueDate, dueDate, dto.getSchoolId(), dto.getAcademicYear());

            if (rows == 1) {
                result.put("success", true);
                result.put("message", "Book issued successfully!");
                result.put("issueNo", issueNo);
                result.put("issueDate", issueDate);
                result.put("dueDate", dueDate);

                // Get updated member info
                MemberInfoDTO memberInfo = getMemberInfo(dto.getMemberCode(), dto.getMemberType(),
                        dto.getSchoolId(), dto.getAcademicYear());
                result.put("memberInfo", memberInfo);
            } else {
                throw new RuntimeException("Failed to issue book");
            }

        } catch (Exception e) {
            log.error("Error issuing book: ", e);
            throw new RuntimeException("Failed to issue book: " + e.getMessage());
        }

        return result;
    }

    // --- 6. SCAN BOOK FOR RETURN (with fine calculation) ---
    public Map<String, Object> scanBookForReturn(String qrCode, String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        String sql = """
            SELECT lir.*,
                   DATEDIFF(CURDATE(), lir.max_return_date) as days_overdue,
                   CASE WHEN lir.max_return_date < CURDATE() AND lir.status = 'ISSUED'
                        THEN DATEDIFF(CURDATE(), lir.max_return_date) * ? 
                        ELSE 0 END as fine_due,
                   ls.book_name, ls.author_name
            FROM library_issue_returns lir
            LEFT JOIN library_stocks ls ON lir.book_qr_code = ls.qr_code_no
            WHERE lir.book_qr_code = ? AND lir.school_id = ? AND lir.status = 'ISSUED'
            LIMIT 1
        """;

        List<Map<String, Object>> records = jdbc.queryForList(sql, DAILY_FINE, qrCode, schoolId);

        if (records.isEmpty()) {
            throw new RuntimeException("No active issue found for this book QR code");
        }

        Map<String, Object> record = records.get(0);
        int daysOverdue = ((Number) record.get("days_overdue")).intValue();
        double fineDue = ((Number) record.get("fine_due")).doubleValue();

        Map<String, Object> result = new HashMap<>();
        result.put("issueRecord", record);
        result.put("daysOverdue", Math.max(daysOverdue, 0));
        result.put("fineDue", fineDue);
        result.put("finePerDay", DAILY_FINE);
        result.put("canReturn", true);

        if (daysOverdue > 0) {
            result.put("message", "Book is overdue by " + daysOverdue + " days. Fine: ₹" + fineDue);
        } else {
            result.put("message", "Book can be returned. No fine due.");
        }

        return result;
    }

    // --- 7. IMPROVED RETURN BOOK ---
    @Transactional
    public Map<String, Object> returnBook(String issueNo, String schoolId, double finePaid, String remarks) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        String sql = "SELECT * FROM library_issue_returns WHERE issue_no = ? AND school_id = ? FOR UPDATE";
        List<LibraryIssueReturn> list = jdbc.query(sql, new BeanPropertyRowMapper<>(LibraryIssueReturn.class), issueNo, schoolId);

        if (list.isEmpty()) {
            throw new RuntimeException("Issue record not found");
        }

        LibraryIssueReturn issue = list.get(0);

        if ("RETURNED".equals(issue.getStatus())) {
            throw new RuntimeException("Book already returned");
        }

        // Calculate fine
        LocalDate returnDate = LocalDate.now();
        int daysOverdue = 0;
        double fineDue = 0.0;

        if (returnDate.isAfter(issue.getMaxReturnDate())) {
            daysOverdue = Period.between(issue.getMaxReturnDate(), returnDate).getDays();
            fineDue = daysOverdue * DAILY_FINE;
        }

        // Update record
        String updateSql = """
            UPDATE library_issue_returns 
            SET status = 'RETURNED', 
                actual_return_date = ?,
                fine_amount = ?,
                fine_paid = ?,
                remarks = ?,
                updated_at = NOW()
            WHERE issue_no = ? AND school_id = ?
        """;

        int rows = jdbc.update(updateSql, returnDate, fineDue, finePaid,
                remarks, issueNo, schoolId);

        if (rows == 1) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Book returned successfully!");
            result.put("returnDate", returnDate);
            result.put("daysOverdue", daysOverdue);
            result.put("fineCalculated", fineDue);
            result.put("finePaid", finePaid);
            result.put("balance", fineDue - finePaid);

            return result;
        } else {
            throw new RuntimeException("Failed to update return record");
        }
    }

    // --- 8. GET MEMBER BORROWING HISTORY ---
    public List<Map<String, Object>> getMemberBorrowingHistory(String memberCode, String memberType,
                                                               String schoolId, String academicYear, int limit) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        String sql = """
            SELECT 
                issue_no,
                book_name,
                author_name,
                issue_date,
                max_return_date,
                actual_return_date,
                status,
                fine_amount,
                fine_paid,
                CASE WHEN max_return_date < CURDATE() AND status = 'ISSUED' 
                     THEN DATEDIFF(CURDATE(), max_return_date) * ? 
                     ELSE 0 END as current_fine,
                CASE WHEN status = 'RETURNED' THEN 'Returned'
                     WHEN max_return_date < CURDATE() THEN 'Overdue'
                     ELSE 'Issued' END as display_status
            FROM library_issue_returns 
            WHERE member_code = ? AND member_type = ? AND school_id = ?
            ORDER BY issue_date DESC 
            LIMIT ?
        """;

        return jdbc.queryForList(sql, DAILY_FINE, memberCode, memberType, schoolId, limit);
    }

    // --- 9. FIND ACTIVE ISSUE BY QR (legacy support) ---
    public LibraryIssueReturn findActiveIssueByBookQR(String bookQrCode, String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String sql = """
            SELECT * FROM library_issue_returns 
            WHERE book_qr_code = ? AND school_id = ? AND status = 'ISSUED' 
            LIMIT 1
        """;
        List<LibraryIssueReturn> list = jdbc.query(sql, new BeanPropertyRowMapper<>(LibraryIssueReturn.class), bookQrCode, schoolId);
        return list.isEmpty() ? null : list.get(0);
    }

    // --- 10. GET ISSUE DETAILS ---
    public LibraryIssueReturn getIssueDetails(String issueNo, String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String sql = "SELECT * FROM library_issue_returns WHERE issue_no = ? AND school_id = ?";
        List<LibraryIssueReturn> list = jdbc.query(sql, new BeanPropertyRowMapper<>(LibraryIssueReturn.class), issueNo, schoolId);
        return list.isEmpty() ? null : list.get(0);
    }
}