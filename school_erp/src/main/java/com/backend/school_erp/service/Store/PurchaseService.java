package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.PurchaseTransactionDTO;
import com.backend.school_erp.config.DatabaseConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class PurchaseService {
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

    private void ensureTablesExist(JdbcTemplate jdbc) {
        // 1. Purchase Header
        jdbc.execute("CREATE TABLE IF NOT EXISTS purchase_header (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "bill_number VARCHAR(50), entry_number VARCHAR(50), entry_date DATE, " +
                "supplier_code VARCHAR(50), supplier_name VARCHAR(100), month VARCHAR(20), " +
                "total_amount DOUBLE, school_id VARCHAR(50), academic_year VARCHAR(20))");

        // 2. Purchase Daily
        jdbc.execute("CREATE TABLE IF NOT EXISTS purchase_daily (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "bill_number VARCHAR(50), entry_date DATE, month VARCHAR(20), supplier_code VARCHAR(50), " +
                "item_code VARCHAR(50), description VARCHAR(255), head VARCHAR(50), " +
                "standard VARCHAR(50), unit VARCHAR(20), quantity INT, rate DOUBLE, " +
                "gst_percent DOUBLE, line_total DOUBLE, school_id VARCHAR(50), academic_year VARCHAR(20))");

        // 3. Stock
        jdbc.execute("CREATE TABLE IF NOT EXISTS stock (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "item_code VARCHAR(50) UNIQUE, item_name VARCHAR(255), total_quantity INT, " +
                "purchase_rate DOUBLE, head VARCHAR(50), unit VARCHAR(20), gst_percent DOUBLE, " +
                "school_id VARCHAR(50))");
    }

    @Transactional
    public void savePurchase(PurchaseTransactionDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(dto.getSchoolId());
        ensureTablesExist(jdbc);

        // 1. Save Header
        jdbc.update("INSERT INTO purchase_header (bill_number, entry_number, entry_date, supplier_code, supplier_name, month, total_amount, school_id, academic_year) VALUES (?,?,?,?,?,?,?,?,?)",
                dto.getBillNumber(), dto.getEntryNumber(), dto.getEntryDate(), dto.getSupplierCode(), dto.getSupplierName(),
                dto.getMonth(), dto.getGrossAmount(), dto.getSchoolId(), dto.getAcademicYear());

        // 2. Save Items
        String dailySql = "INSERT INTO purchase_daily (bill_number, entry_date, month, supplier_code, item_code, description, head, standard, unit, quantity, rate, gst_percent, line_total, school_id, academic_year) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

        for (PurchaseTransactionDTO.PurchaseItemDTO item : dto.getItems()) {
            // A. Save to Purchase Daily
            jdbc.update(dailySql,
                    dto.getBillNumber(),
                    dto.getEntryDate(),
                    dto.getMonth(),
                    dto.getSupplierCode(), item.getItemCode(), item.getDescription(),
                    item.getHead(), item.getStandard(), item.getUnit(), item.getQuantity(),
                    item.getRate(), item.getGstPercent(), item.getTotal(), dto.getSchoolId(), dto.getAcademicYear());

            // B. Update Stock (Standard removed per previous instruction)
            updateStock(jdbc, item, dto.getSchoolId());
        }
    }

    private void updateStock(JdbcTemplate jdbc, PurchaseTransactionDTO.PurchaseItemDTO item, String schoolId) {
        try {
            Integer currentQty = jdbc.queryForObject("SELECT total_quantity FROM stock WHERE item_code = ?", Integer.class, item.getItemCode());
            int newTotal = currentQty + item.getQuantity();

            jdbc.update("UPDATE stock SET total_quantity = ?, purchase_rate = ?, head = ?, unit = ? WHERE item_code = ?",
                    newTotal, item.getRate(), item.getHead(), item.getUnit(), item.getItemCode());

        } catch (EmptyResultDataAccessException e) {
            jdbc.update("INSERT INTO stock (item_code, item_name, total_quantity, purchase_rate, head, unit, gst_percent, school_id) VALUES (?,?,?,?,?,?,?,?)",
                    item.getItemCode(), item.getDescription(), item.getQuantity(), item.getRate(),
                    item.getHead(), item.getUnit(), item.getGstPercent(), schoolId);
        }
    }

    // 👈 UPDATED METHOD: Gets stock by summing Purchase Daily records
    public Integer getCurrentStock(String schoolId, String itemCode) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);
        try {
            // Calculates SUM of all quantities for this item from purchase history
            Integer totalPurchased = jdbc.queryForObject(
                    "SELECT COALESCE(SUM(quantity), 0) FROM purchase_daily WHERE item_code = ?",
                    Integer.class,
                    itemCode
            );
            return totalPurchased != null ? totalPurchased : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    public String generateEntryNumber(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM purchase_header", Integer.class);
        return "Bill" + String.format("%06d", (count != null ? count : 0) + 1);
    }
}