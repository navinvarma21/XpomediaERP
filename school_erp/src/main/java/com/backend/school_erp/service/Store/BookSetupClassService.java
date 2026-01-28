package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.BookSetupClassDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Store.BookSetupClass;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class BookSetupClassService {
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
        // Ensure Book Setup Table Exists
        jdbc.execute("CREATE TABLE IF NOT EXISTS book_setup_classes (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "standard VARCHAR(50), " +
                "book_id VARCHAR(255), " +
                "quantity INT, " +
                "amount DOUBLE, " +
                "entry_date DATE, " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");
    }

    @Transactional
    public void saveBookSetupClass(String schoolId, BookSetupClassDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String insertSetupSql = "INSERT INTO book_setup_classes (standard, book_id, quantity, amount, entry_date, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)";

        LocalDate dateToSave = (dto.getEntryDate() != null) ? dto.getEntryDate() : LocalDate.now();

        for (String std : dto.getStandards()) {
            for (BookSetupClassDTO.BookEntry book : dto.getBooks()) {
                // 1. Save to Book Setup Class Table ONLY
                // No Stock Update Logic Here anymore.
                jdbc.update(insertSetupSql, std, book.getBookId(), book.getQuantity(), book.getAmount(), dateToSave, schoolId, dto.getAcademicYear());
            }
        }
    }

    public List<BookSetupClass> getBookSetupClasses(String schoolId, String year) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query("SELECT * FROM book_setup_classes WHERE academic_year = ? ORDER BY entry_date DESC",
                new BeanPropertyRowMapper<>(BookSetupClass.class), year);
    }

    public List<BookSetupClass> getBookSetupClassesByDate(String schoolId, String year, LocalDate date) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query("SELECT * FROM book_setup_classes WHERE academic_year = ? AND entry_date = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(BookSetupClass.class), year, date);
    }

    @Transactional
    public void updateBookSetupClass(String schoolId, Long id, BookSetupClass updatedData) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = "UPDATE book_setup_classes SET book_id = ?, quantity = ?, amount = ? WHERE id = ? AND school_id = ?";

        jdbc.update(sql,
                updatedData.getBookId(),
                updatedData.getQuantity(),
                updatedData.getAmount(),
                id,
                schoolId
        );
    }

    public void deleteBookSetupClass(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        jdbc.update("DELETE FROM book_setup_classes WHERE id = ?", id);
    }
}