package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.BookDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Store.Book;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class BookService {
    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private void ensureTableExists(JdbcTemplate jdbc) {
        jdbc.execute("CREATE TABLE IF NOT EXISTS books (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "book_code VARCHAR(50), " +
                "book_name VARCHAR(255) NOT NULL, " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20), " +
                "UNIQUE(book_name, school_id))");
    }

    // ✅ NEW: Generate Next Code (e.g., BK-001)
    public String generateNextBookCode(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        try {
            // Get the last inserted code
            String sql = "SELECT book_code FROM books ORDER BY id DESC LIMIT 1";
            String lastCode = jdbc.queryForObject(sql, String.class);

            if (lastCode == null || !lastCode.startsWith("BK-")) {
                return "BK-001";
            }

            // Extract number and increment
            int num = Integer.parseInt(lastCode.split("-")[1]);
            return String.format("BK-%03d", num + 1);

        } catch (EmptyResultDataAccessException | NumberFormatException | ArrayIndexOutOfBoundsException e) {
            return "BK-001"; // Default if table empty or format wrong
        }
    }

    public List<Book> getBooks(String schoolId, String year) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query("SELECT * FROM books WHERE academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(Book.class), year);
    }

    public Book addBook(String schoolId, BookDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // ✅ Auto Generate Code
        String newCode = generateNextBookCode(schoolId);

        try {
            jdbc.update("INSERT INTO books (book_code, book_name, school_id, academic_year) VALUES (?, ?, ?, ?)",
                    newCode, dto.getBookName(), schoolId, dto.getAcademicYear());

        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Subject/Item Name already exists: " + dto.getBookName());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return Book.builder()
                .id(lastId)
                .bookCode(newCode)
                .bookName(dto.getBookName())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public Book updateBook(String schoolId, Long id, BookDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // Code is usually not editable, only Name
        int rows = jdbc.update(
                "UPDATE books SET book_name = ? WHERE id = ?",
                dto.getBookName(), id
        );
        if (rows == 0) throw new RuntimeException("Entry not found with id " + id);

        return jdbc.queryForObject(
                "SELECT * FROM books WHERE id = ?",
                new BeanPropertyRowMapper<>(Book.class),
                id
        );
    }

    public void deleteBook(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        int rows = jdbc.update("DELETE FROM books WHERE id = ?", id);
        if (rows == 0) throw new RuntimeException("Entry not found with id " + id);
    }
}