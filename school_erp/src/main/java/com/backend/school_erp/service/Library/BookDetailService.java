package com.backend.school_erp.service.Library;

import com.backend.school_erp.DTO.Library.BookDetailDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Library.BookDetail;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class BookDetailService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating HikariCP DataSource for school: {}", id);
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
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS book_details (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                book_id VARCHAR(50) NOT NULL,
                isbn VARCHAR(20),
                book_cover_photo MEDIUMBLOB,
                book_title VARCHAR(255) NOT NULL,
                author_name VARCHAR(100) NOT NULL,
                category VARCHAR(50),
                edition VARCHAR(50),
                publisher VARCHAR(100),
                total_copies INT NOT NULL,
                available_copies INT NOT NULL,
                book_status VARCHAR(50),
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                language VARCHAR(50),
                pages INT,
                published_date VARCHAR(20),
                description TEXT,
                
                -- New pricing columns
                purchase_rate DECIMAL(10, 2),
                selling_rate DECIMAL(10, 2),
                mrp DECIMAL(10, 2),
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_book (book_id, school_id, academic_year)
            )
        """);

        // Add new columns if they don't exist
        try {
            jdbc.execute("ALTER TABLE book_details ADD COLUMN IF NOT EXISTS purchase_rate DECIMAL(10, 2)");
            jdbc.execute("ALTER TABLE book_details ADD COLUMN IF NOT EXISTS selling_rate DECIMAL(10, 2)");
            jdbc.execute("ALTER TABLE book_details ADD COLUMN IF NOT EXISTS mrp DECIMAL(10, 2)");
            log.info("Ensured pricing columns exist in book_details table");
        } catch (Exception e) {
            log.warn("Could not add pricing columns: {}", e.getMessage());
        }

        try {
            jdbc.execute("""
                ALTER TABLE book_details MODIFY COLUMN book_cover_photo MEDIUMBLOB
            """);
            log.info("Ensured book_cover_photo column is MEDIUMBLOB");
        } catch (Exception e) {
            log.warn("Could not modify book_cover_photo column to MEDIUMBLOB: {}", e.getMessage());
        }
    }

    // Method to generate auto Book ID WITHOUT XPO
    public String generateBookId(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // Generate school code from schoolId (ensure no XPO)
        String schoolCode = generateSchoolCode(schoolId);

        // Get academic year code (last 2 digits)
        String yearCode = getYearCode(academicYear);

        // Get next sequence number for this school and academic year
        String countQuery = "SELECT COALESCE(COUNT(*), 0) + 1 " +
                "FROM book_details WHERE school_id = ? AND academic_year = ?";
        Integer nextNumber = jdbc.queryForObject(countQuery, Integer.class, schoolId, academicYear);

        if (nextNumber == null) {
            nextNumber = 1;
        }

        // Format: BK-SCHOOLCODE-YEAR-SEQ (e.g., BK-SCHL-24-0001)
        String bookId = String.format("BK-%s-%s-%04d", schoolCode, yearCode, nextNumber);

        // Double-check to ensure no XPO
        if (bookId.contains("XPO")) {
            // Regenerate with timestamp
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"));
            bookId = String.format("BK-%s-%s-%s", schoolCode, yearCode, timestamp);
        }

        return bookId;
    }

    // Generate school code without XPO
    private String generateSchoolCode(String schoolId) {
        if (schoolId == null || schoolId.trim().isEmpty()) {
            return "SCHL";
        }

        // Clean the schoolId
        String cleanId = schoolId.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();

        // Get first 4 characters or pad if shorter
        String code;
        if (cleanId.length() >= 4) {
            code = cleanId.substring(0, 4);
        } else {
            code = String.format("%-4s", cleanId).replace(' ', '0');
        }

        // Check if code contains XPO and replace if needed
        if (code.contains("XPO")) {
            // Replace XPO with alternative
            code = code.replace("XPO", "SCH");
        }

        // If still contains XPO (edge case), use hash-based code
        if (code.contains("XPO")) {
            int hash = Math.abs(schoolId.hashCode() % 1000);
            code = String.format("S%03d", hash);
        }

        return code;
    }

    // Get year code from academic year
    private String getYearCode(String academicYear) {
        if (academicYear == null || academicYear.trim().isEmpty()) {
            return String.valueOf(LocalDateTime.now().getYear() % 100);
        }

        // Extract last 2 digits
        String year = academicYear.replaceAll("[^0-9]", "");
        if (year.length() >= 2) {
            return year.substring(year.length() - 2);
        } else if (year.length() == 1) {
            return "0" + year;
        } else {
            return String.valueOf(LocalDateTime.now().getYear() % 100);
        }
    }

    private static class BookDetailRowMapper implements RowMapper<BookDetail> {
        @Override
        public BookDetail mapRow(ResultSet rs, int rowNum) throws SQLException {
            return BookDetail.builder()
                    .id(rs.getLong("id"))
                    .bookId(rs.getString("book_id"))
                    .isbn(rs.getString("isbn"))
                    .bookCoverPhoto(rs.getBytes("book_cover_photo"))
                    .bookTitle(rs.getString("book_title"))
                    .authorName(rs.getString("author_name"))
                    .category(rs.getString("category"))
                    .edition(rs.getString("edition"))
                    .publisher(rs.getString("publisher"))
                    .totalCopies(rs.getInt("total_copies"))
                    .availableCopies(rs.getInt("available_copies"))
                    .bookStatus(rs.getString("book_status"))
                    .schoolId(rs.getString("school_id"))
                    .academicYear(rs.getString("academic_year"))
                    .language(rs.getString("language"))
                    .pages(rs.getInt("pages"))
                    .publishedDate(rs.getString("published_date"))
                    .description(rs.getString("description"))

                    // New pricing fields
                    .purchaseRate(rs.getBigDecimal("purchase_rate"))
                    .sellingRate(rs.getBigDecimal("selling_rate"))
                    .mrp(rs.getBigDecimal("mrp"))

                    .build();
        }
    }

    public BookDetail addBookDetail(String schoolId, BookDetailDTO dto, byte[] coverPhoto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // Generate auto Book ID if not provided
        if (dto.getBookId() == null || dto.getBookId().trim().isEmpty()) {
            String autoBookId = generateBookId(schoolId, dto.getAcademicYear());
            dto.setBookId(autoBookId);
        }

        // Validate Book ID doesn't contain XPO
        if (dto.getBookId().toUpperCase().contains("XPO")) {
            throw new RuntimeException("Book ID cannot contain 'XPO'. Please use a different ID.");
        }

        // Validate availableCopies <= totalCopies
        if (dto.getAvailableCopies() == null) {
            dto.setAvailableCopies(dto.getTotalCopies());
        } else if (dto.getAvailableCopies() > dto.getTotalCopies()) {
            throw new RuntimeException("Available copies cannot exceed total copies");
        }

        // Validate pricing logic (only if both values are provided)
        if (dto.getPurchaseRate() != null && dto.getSellingRate() != null) {
            if (dto.getPurchaseRate().compareTo(dto.getSellingRate()) > 0) {
                throw new RuntimeException("Purchase rate cannot exceed selling rate");
            }
        }

        if (dto.getSellingRate() != null && dto.getMrp() != null) {
            if (dto.getSellingRate().compareTo(dto.getMrp()) > 0) {
                throw new RuntimeException("Selling rate cannot exceed MRP");
            }
        }

        // Insert the book
        String sql = """
            INSERT INTO book_details (
                book_id, isbn, book_cover_photo, book_title, author_name, 
                category, edition, publisher, total_copies, available_copies, 
                book_status, school_id, academic_year, language, pages, 
                published_date, description, purchase_rate, selling_rate, mrp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        int rows = jdbc.update(sql,
                dto.getBookId(), dto.getIsbn(), coverPhoto, dto.getBookTitle(), dto.getAuthorName(),
                dto.getCategory(), dto.getEdition(), dto.getPublisher(), dto.getTotalCopies(),
                dto.getAvailableCopies(), dto.getBookStatus(), schoolId, dto.getAcademicYear(),
                dto.getLanguage(), dto.getPages(), dto.getPublishedDate(), dto.getDescription(),
                dto.getPurchaseRate(), dto.getSellingRate(), dto.getMrp()
        );

        if (rows == 0) {
            throw new RuntimeException("Failed to add book detail: " + dto.getBookId());
        }

        // Get the inserted book
        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return getBookById(schoolId, lastId);
    }

    public List<BookDetail> getAllBooks(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = "SELECT * FROM book_details WHERE school_id = ? AND academic_year = ? ORDER BY created_at DESC";
        return jdbc.query(sql, new BookDetailRowMapper(), schoolId, academicYear);
    }

    public BookDetail getBookById(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = "SELECT * FROM book_details WHERE id = ? AND school_id = ?";
        List<BookDetail> results = jdbc.query(sql, new BookDetailRowMapper(), id, schoolId);

        if (results.isEmpty()) {
            throw new RuntimeException("Book not found with id: " + id);
        }
        return results.get(0);
    }

    public BookDetail updateBookDetail(String schoolId, Long id, BookDetailDTO dto, byte[] coverPhoto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // Check if book exists
        BookDetail existing = getBookById(schoolId, id);

        // Validate Book ID doesn't contain XPO
        if (dto.getBookId().toUpperCase().contains("XPO")) {
            throw new RuntimeException("Book ID cannot contain 'XPO'");
        }

        // Validate availableCopies <= totalCopies
        if (dto.getAvailableCopies() == null) {
            dto.setAvailableCopies(dto.getTotalCopies());
        } else if (dto.getAvailableCopies() > dto.getTotalCopies()) {
            throw new RuntimeException("Available copies cannot exceed total copies");
        }

        // Validate pricing logic (only if both values are provided)
        if (dto.getPurchaseRate() != null && dto.getSellingRate() != null) {
            if (dto.getPurchaseRate().compareTo(dto.getSellingRate()) > 0) {
                throw new RuntimeException("Purchase rate cannot exceed selling rate");
            }
        }

        if (dto.getSellingRate() != null && dto.getMrp() != null) {
            if (dto.getSellingRate().compareTo(dto.getMrp()) > 0) {
                throw new RuntimeException("Selling rate cannot exceed MRP");
            }
        }

        // Use existing photo if no new photo provided
        byte[] photoToUse = (coverPhoto != null && coverPhoto.length > 0) ? coverPhoto : existing.getBookCoverPhoto();

        String sql = """
            UPDATE book_details 
            SET book_id = ?, isbn = ?, book_cover_photo = ?, book_title = ?, 
                author_name = ?, category = ?, edition = ?, publisher = ?, 
                total_copies = ?, available_copies = ?, book_status = ?, 
                language = ?, pages = ?, published_date = ?, description = ?,
                purchase_rate = ?, selling_rate = ?, mrp = ?
            WHERE id = ? AND school_id = ?
        """;

        int rows = jdbc.update(sql,
                dto.getBookId(), dto.getIsbn(), photoToUse, dto.getBookTitle(),
                dto.getAuthorName(), dto.getCategory(), dto.getEdition(), dto.getPublisher(),
                dto.getTotalCopies(), dto.getAvailableCopies(), dto.getBookStatus(),
                dto.getLanguage(), dto.getPages(), dto.getPublishedDate(), dto.getDescription(),
                dto.getPurchaseRate(), dto.getSellingRate(), dto.getMrp(),
                id, schoolId
        );

        if (rows == 0) {
            throw new RuntimeException("Failed to update book with id: " + id);
        }

        return getBookById(schoolId, id);
    }

    public void deleteBookDetail(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = "DELETE FROM book_details WHERE id = ? AND school_id = ?";
        int rows = jdbc.update(sql, id, schoolId);

        if (rows == 0) {
            throw new RuntimeException("Book not found with id: " + id);
        }

        log.info("Successfully deleted book with id: {} from school: {}", id, schoolId);
    }

    public List<BookDetail> searchBooks(String schoolId, String academicYear, String searchTerm) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = """
            SELECT * FROM book_details
            WHERE school_id = ? AND academic_year = ?
            AND (book_title LIKE ? OR author_name LIKE ? OR isbn LIKE ? 
                 OR category LIKE ? OR publisher LIKE ? OR book_id LIKE ?)
            ORDER BY created_at DESC
        """;

        String searchPattern = "%" + searchTerm + "%";
        return jdbc.query(sql, new BookDetailRowMapper(),
                schoolId, academicYear, searchPattern, searchPattern, searchPattern,
                searchPattern, searchPattern, searchPattern);
    }

    // Methods for available copies management
    public void decreaseAvailableCopies(String schoolId, String bookId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = "UPDATE book_details SET available_copies = available_copies - 1 WHERE book_id = ? AND school_id = ? AND available_copies > 0";
        int rows = jdbc.update(sql, bookId, schoolId);

        if (rows == 0) {
            throw new RuntimeException("Book not available or not found: " + bookId);
        }

        log.info("Decreased available copies for book: {} in school: {}", bookId, schoolId);
    }

    public void increaseAvailableCopies(String schoolId, String bookId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = "UPDATE book_details SET available_copies = available_copies + 1 WHERE book_id = ? AND school_id = ?";
        int rows = jdbc.update(sql, bookId, schoolId);

        if (rows == 0) {
            throw new RuntimeException("Book not found: " + bookId);
        }

        log.info("Increased available copies for book: {} in school: {}", bookId, schoolId);
    }
}