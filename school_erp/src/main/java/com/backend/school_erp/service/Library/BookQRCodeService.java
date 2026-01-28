package com.backend.school_erp.service.Library;

import com.backend.school_erp.DTO.Library.BookQRCodeDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Library.LibraryStock;
import com.backend.school_erp.entity.Library.ItemPurchase;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class BookQRCodeService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            config.setMaximumPoolSize(10);
            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private void ensureTablesExist(JdbcTemplate jdbc) {
        try {
            // 1. Library Stocks (Unique by QR Code, allows duplicate Book Codes)
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS library_stocks (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    qr_code_no VARCHAR(200) NOT NULL,
                    book_code VARCHAR(100) NOT NULL,
                    book_name VARCHAR(500) NOT NULL,
                    mrp_rate DECIMAL(15,2) DEFAULT 0.00,
                    purchase_rate DECIMAL(15,2) DEFAULT 0.00,
                    selling_rate DECIMAL(15,2) DEFAULT 0.00,
                    department_name VARCHAR(200),
                    quantity INT DEFAULT 0,
                    publisher_name VARCHAR(300),
                    author_name VARCHAR(300),
                    language VARCHAR(100),
                    supplier_name VARCHAR(300),
                    remarks TEXT,
                    qr_code_image LONGTEXT,
                    school_id VARCHAR(100) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_book_code (book_code),
                    UNIQUE KEY uk_school_qr (school_id, qr_code_no)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);

            // 2. Item Purchases
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS item_purchases (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    purchase_id VARCHAR(100),
                    qr_code_no VARCHAR(200) NOT NULL,
                    book_code VARCHAR(100) NOT NULL,
                    book_name VARCHAR(500),
                    mrp_rate DECIMAL(15,2) DEFAULT 0.00,
                    purchase_rate DECIMAL(15,2) DEFAULT 0.00,
                    selling_rate DECIMAL(15,2) DEFAULT 0.00,
                    department_name VARCHAR(200),
                    quantity INT NOT NULL,
                    publisher_name VARCHAR(300),
                    author_name VARCHAR(300),
                    language VARCHAR(100),
                    supplier_name VARCHAR(300),
                    remarks TEXT,
                    total_amount DECIMAL(15,2) DEFAULT 0.00,
                    qr_code_image LONGTEXT,
                    school_id VARCHAR(100) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_qr_code (qr_code_no, school_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);

            // 3. Sequences
            jdbc.execute("CREATE TABLE IF NOT EXISTS qr_sequence (id INT AUTO_INCREMENT PRIMARY KEY, school_id VARCHAR(100) UNIQUE NOT NULL, last_qr_number INT DEFAULT 0, last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB");
            jdbc.execute("CREATE TABLE IF NOT EXISTS book_sequence (id INT AUTO_INCREMENT PRIMARY KEY, school_id VARCHAR(100) UNIQUE NOT NULL, last_number INT DEFAULT 1, last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB");

        } catch (Exception e) {
            log.error("Table check failed", e);
        }
    }

    // --- GENERATORS ---

    public String generateQRCodeNo(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);
        String schoolPrefix = schoolId.length() >= 3 ? schoolId.substring(0, 3).toUpperCase() : "SCH";
        String yearSuffix = academicYear.length() >= 2 ? academicYear.substring(academicYear.length()-2) : "24";

        Integer last = null;
        try { last = jdbc.queryForObject("SELECT last_qr_number FROM qr_sequence WHERE school_id = ? FOR UPDATE", Integer.class, schoolId); } catch(Exception e){}

        int next = (last == null) ? 1 : last + 1;
        if(last == null) jdbc.update("INSERT INTO qr_sequence (school_id, last_qr_number) VALUES (?, ?)", schoolId, next);
        else jdbc.update("UPDATE qr_sequence SET last_qr_number = ? WHERE school_id = ?", next, schoolId);

        return String.format("QR%s%s%05d", schoolPrefix, yearSuffix, next);
    }

    public String generateBookCode(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);
        String year = String.valueOf(java.time.LocalDate.now().getYear());
        Integer last = null;
        try { last = jdbc.queryForObject("SELECT last_number FROM book_sequence WHERE school_id = ?", Integer.class, schoolId); } catch(Exception e){}

        int next = (last == null) ? 1 : last + 1;
        if(last == null) jdbc.update("INSERT INTO book_sequence (school_id, last_number) VALUES (?, ?)", schoolId, next);
        else jdbc.update("UPDATE book_sequence SET last_number = ? WHERE school_id = ?", next, schoolId);

        return String.format("BK-%s-%04d", year, next);
    }

    // --- SAVE LOGIC ---

    @Transactional
    public void saveQRCodeData(BookQRCodeDTO dto, boolean isNewQRSetup) {
        JdbcTemplate jdbc = getJdbcTemplate(dto.getSchoolId());
        ensureTablesExist(jdbc);

        // ALWAYS INSERT - Create individual records for every batch
        String insertStock = """
            INSERT INTO library_stocks (qr_code_no, book_code, book_name, mrp_rate, purchase_rate, selling_rate, department_name, quantity, publisher_name, author_name, language, supplier_name, remarks, qr_code_image, school_id, academic_year)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        jdbc.update(insertStock,
                dto.getQrCodeNo(), dto.getBookCode(), dto.getBookName(),
                dto.getMrpRate(), dto.getPurchaseRate(), dto.getSellingRate(),
                dto.getDepartmentName(), dto.getQuantity(), dto.getPublisherName(),
                dto.getAuthorName(), dto.getLanguage(), dto.getSupplierName(),
                dto.getRemarks(), dto.getQrCodeImage(), dto.getSchoolId(), dto.getAcademicYear()
        );

        // CREATE PURCHASE RECORD
        Integer purCount = jdbc.queryForObject("SELECT COUNT(*) FROM item_purchases WHERE school_id = ?", Integer.class, dto.getSchoolId());
        String pid = "PUR-" + dto.getSchoolId().substring(0,3).toUpperCase() + "-" + (purCount + 1);
        BigDecimal total = dto.getPurchaseRate().multiply(BigDecimal.valueOf(dto.getQuantity()));

        String insertPur = """
            INSERT INTO item_purchases (purchase_id, qr_code_no, book_code, book_name, mrp_rate, purchase_rate, selling_rate, department_name, quantity, publisher_name, author_name, language, supplier_name, remarks, total_amount, qr_code_image, school_id, academic_year)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        jdbc.update(insertPur,
                pid, dto.getQrCodeNo(), dto.getBookCode(), dto.getBookName(),
                dto.getMrpRate(), dto.getPurchaseRate(), dto.getSellingRate(),
                dto.getDepartmentName(), dto.getQuantity(), dto.getPublisherName(),
                dto.getAuthorName(), dto.getLanguage(), dto.getSupplierName(),
                dto.getRemarks(), total, dto.getQrCodeImage(), dto.getSchoolId(), dto.getAcademicYear()
        );
    }

    // --- GETTERS (Including the missing one!) ---

    public LibraryStock getStockByQr(String qr, String sid) {
        JdbcTemplate jdbc = getJdbcTemplate(sid);
        ensureTablesExist(jdbc);
        List<LibraryStock> list = jdbc.query("SELECT * FROM library_stocks WHERE qr_code_no = ? AND school_id = ?", new BeanPropertyRowMapper<>(LibraryStock.class), qr, sid);
        if(list.isEmpty()) return null;
        LibraryStock s = list.get(0);
        if(s.getQrCodeImage() != null && !s.getQrCodeImage().startsWith("data:")) s.setQrCodeImage("data:image/png;base64,"+s.getQrCodeImage());
        return s;
    }

    public List<LibraryStock> getExistingBooks(String sid, String year) {
        JdbcTemplate jdbc = getJdbcTemplate(sid);
        ensureTablesExist(jdbc);
        return jdbc.query("SELECT * FROM library_stocks WHERE school_id = ? AND academic_year = ? ORDER BY id DESC", new BeanPropertyRowMapper<>(LibraryStock.class), sid, year);
    }

    // THIS WAS MISSING - RE-ADDED
    public LibraryStock getBookDetails(String bookCode, String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);
        // Returns the first match for this book code to populate details
        String sql = "SELECT * FROM library_stocks WHERE book_code = ? AND school_id = ? AND academic_year = ? LIMIT 1";
        List<LibraryStock> books = jdbc.query(sql, new BeanPropertyRowMapper<>(LibraryStock.class), bookCode, schoolId, academicYear);

        if (!books.isEmpty()) {
            LibraryStock book = books.get(0);
            if (book.getQrCodeImage() != null && !book.getQrCodeImage().startsWith("data:image")) {
                book.setQrCodeImage("data:image/png;base64," + book.getQrCodeImage());
            }
            return book;
        }
        return null;
    }

    // Alias for getBookDetails
    public LibraryStock getBookByCode(String bookCode, String schoolId, String academicYear) {
        return getBookDetails(bookCode, schoolId, academicYear);
    }

    // Alias for getExistingBooks (Controller might use this name)
    public List<LibraryStock> getLibraryStocks(String schoolId, String academicYear) {
        return getExistingBooks(schoolId, academicYear);
    }

    public List<ItemPurchase> getPurchaseHistoryForBook(String bookCode, String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);
        return jdbc.query("SELECT * FROM item_purchases WHERE book_code = ? AND school_id = ? AND academic_year = ? ORDER BY purchase_date DESC",
                new BeanPropertyRowMapper<>(ItemPurchase.class), bookCode, schoolId, academicYear);
    }

    public List<ItemPurchase> getItemPurchases(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);
        return jdbc.query("SELECT * FROM item_purchases WHERE school_id = ? AND academic_year = ? ORDER BY purchase_date DESC LIMIT 50",
                new BeanPropertyRowMapper<>(ItemPurchase.class), schoolId, academicYear);
    }
}