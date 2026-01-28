package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.PurchaseEntryDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PurchaseEntryService {

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
        // 1. TabPurchase Table
        jdbc.execute("CREATE TABLE IF NOT EXISTS tab_purchase (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "entry_no VARCHAR(50), " +
                "supplier_code VARCHAR(50), " +
                "supplier_name VARCHAR(255), " +
                "tin VARCHAR(50), " +
                "invoice_no VARCHAR(50), " +
                "invoice_date DATE, " +
                "purchase_date DATE, " +
                "gross_amount DOUBLE, " +
                "credit DOUBLE, " +
                "debit DOUBLE, " +
                "narrative TEXT, " +
                "payment_mode VARCHAR(50), " +
                "gst_amount DOUBLE, " +
                "others DOUBLE, " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");

        // 2. SpPayment Table
        jdbc.execute("CREATE TABLE IF NOT EXISTS sp_payment (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "bill_date DATE, " +
                "supplier_code VARCHAR(50), " +
                "supplier_name VARCHAR(255), " +
                "bill_number VARCHAR(50), " +
                "payment_amount DOUBLE, " +
                "balance_amount DOUBLE, " +
                "amount_paid DOUBLE, " +
                "status VARCHAR(50), " +
                "invoice_number VARCHAR(50), " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");
    }

    public String generateEntryNo(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);
        String sql = "SELECT MAX(CAST(SUBSTRING_INDEX(entry_no, '-', -1) AS UNSIGNED)) FROM tab_purchase WHERE school_id = ?";
        Integer maxId;
        try { maxId = jdbc.queryForObject(sql, Integer.class, schoolId); } catch (Exception e) { maxId = 0; }
        int nextId = (maxId == null) ? 1 : maxId + 1;
        return "PUR-ENT-" + String.format("%04d", nextId);
    }

    @Transactional
    public String savePurchaseEntry(String schoolId, String year, PurchaseEntryDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);
        String entryNo = generateEntryNo(schoolId);

        // --- CALCULATIONS ---
        // 1. Taxable (Others) = Base Amount - Discount
        double discountAmt = (dto.getPurchaseAmount() * dto.getDiscountPercent()) / 100.0;
        double taxableAmount = dto.getPurchaseAmount() - discountAmt;

        // 2. GST Amount = Taxable * GST%
        double gstAmt = (taxableAmount * dto.getGstPercent()) / 100.0;

        // 3. Gross/Credit = Taxable + GST
        double grossAmount = taxableAmount + gstAmt;

        // --- SAVE TO TabPurchase ---
        String sqlPurchase = "INSERT INTO tab_purchase (entry_no, supplier_code, supplier_name, tin, invoice_no, invoice_date, purchase_date, gross_amount, credit, debit, narrative, payment_mode, gst_amount, others, school_id, academic_year) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

        jdbc.update(sqlPurchase,
                entryNo,
                dto.getSupplierCode(),
                dto.getSupplierName(),
                "Purchase", // TIN (Tax Identity) is fixed as Purchase
                dto.getInvoiceNo(),
                dto.getInvoiceDate(),
                dto.getPurchaseDate(),
                grossAmount,
                grossAmount, // Credit Column
                0.0,         // Debit Column
                dto.getNarrative(),
                dto.getPaymentMode(),
                gstAmt,
                taxableAmount, // Others (Without GST)
                schoolId,
                year
        );

        // --- SAVE TO SpPayment (Initialize Balance) ---
        String sqlPayment = "INSERT INTO sp_payment (bill_date, supplier_code, supplier_name, bill_number, payment_amount, balance_amount, amount_paid, status, invoice_number, school_id, academic_year) VALUES (?,?,?,?,?,?,?,?,?,?,?)";

        jdbc.update(sqlPayment,
                dto.getInvoiceDate(),
                dto.getSupplierCode(),
                dto.getSupplierName(),
                entryNo,        // Bill Number is the Entry No
                grossAmount,    // Payment Amount (Total Due)
                grossAmount,    // Balance Amount (Initially full amount)
                0.0,            // Amount Paid (0 initially)
                "Pending",
                dto.getInvoiceNo(),
                schoolId,
                year
        );

        return entryNo;
    }
}