package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.SupplierPaymentDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SupplierPaymentService {

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

    // 0. Ensure Tables & Columns Exist
    private void ensureTablesExist(JdbcTemplate jdbc) {
        // 1. Master Payment Table
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

        // 2. Individual History Table
        jdbc.execute("CREATE TABLE IF NOT EXISTS sp_payment_individual (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "payment_date DATE, " +
                "entry_no VARCHAR(50), " +
                "invoice_number VARCHAR(50), " +
                "supplier_code VARCHAR(50), " +
                "gross_amount DOUBLE, " +
                "settlement_amount DOUBLE, " +
                "discount_amount DOUBLE, " +
                "net_cash_paid DOUBLE, " +
                "payment_mode VARCHAR(50), " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");

        // --- AUTO-FIX: Add missing columns if tables existed before ---
        try {
            jdbc.execute("ALTER TABLE sp_payment_individual ADD COLUMN gross_amount DOUBLE");
        } catch (Exception ignored) { /* Column likely exists */ }

        try {
            jdbc.execute("ALTER TABLE tab_purchase ADD COLUMN purchase_narrative TEXT");
        } catch (Exception ignored) { /* Column likely exists */ }
    }

    public String generateEntryNo(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);
        String sql = "SELECT MAX(CAST(SUBSTRING_INDEX(entry_no, '-', -1) AS UNSIGNED)) FROM tab_purchase WHERE tin = 'Supplier Payment' AND school_id = ?";
        Integer maxId;
        try { maxId = jdbc.queryForObject(sql, Integer.class, schoolId); } catch (Exception e) { maxId = 0; }
        int nextId = (maxId == null) ? 1 : maxId + 1;
        return "SUP-PAY-" + String.format("%04d", nextId);
    }

    public List<Map<String, Object>> getPendingSuppliers(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);
        String sql = "SELECT DISTINCT supplier_code, supplier_name FROM sp_payment WHERE status = 'Pending' AND school_id = ?";
        return jdbc.queryForList(sql, schoolId);
    }

    public List<Map<String, Object>> getPendingInvoices(String schoolId, String supplierCode) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        // Ensure we fetch the original narrative
        String sql = "SELECT p.invoice_number, p.balance_amount, p.payment_amount as original_gross, t.narrative " +
                "FROM sp_payment p " +
                "LEFT JOIN tab_purchase t ON p.invoice_number = t.invoice_no AND t.tin = 'Purchase' " +
                "WHERE p.supplier_code = ? AND p.status = 'Pending' AND p.bill_number LIKE 'PUR-ENT%' AND p.school_id = ?";
        return jdbc.queryForList(sql, supplierCode, schoolId);
    }

    @Transactional
    public String savePayment(String schoolId, String year, SupplierPaymentDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);
        String entryNo = generateEntryNo(schoolId);

        // 1. TabPurchase (Journal Entry)
        String sqlJournal = "INSERT INTO tab_purchase (entry_no, supplier_code, supplier_name, tin, invoice_no, invoice_date, purchase_date, gross_amount, credit, debit, narrative, purchase_narrative, payment_mode, gst_amount, others, school_id, academic_year) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

        jdbc.update(sqlJournal,
                entryNo,
                dto.getSupplierCode(),
                dto.getSupplierName(),
                "Supplier Payment",
                dto.getInvoiceNo(),
                LocalDate.now(),
                dto.getPaymentDate(),
                dto.getOriginalGrossAmount(),
                0.0,                    // Credit
                dto.getNetCashPaid(),   // Debit
                dto.getPaidNarrative(), // Paid Narrative
                dto.getPurchaseNarrative(), // Original Narrative
                dto.getPaymentMode(),
                0.0,
                dto.getDiscountAmount(),
                schoolId,
                year
        );

        // 2. Update SpPayment (Master Balance)
        String sqlSelect = "SELECT amount_paid, payment_amount FROM sp_payment WHERE invoice_number = ? AND bill_number LIKE 'PUR-ENT%' AND school_id = ?";
        Map<String, Object> currentData = jdbc.queryForMap(sqlSelect, dto.getInvoiceNo(), schoolId);

        double prevPaid = Double.parseDouble(currentData.get("amount_paid").toString());
        double totalBill = Double.parseDouble(currentData.get("payment_amount").toString());

        double newPaidTotal = prevPaid + dto.getSettlementAmount();
        double newBalance = totalBill - newPaidTotal;
        if(newBalance < 0) newBalance = 0;

        String newStatus = (newBalance <= 0) ? "Settled" : "Pending";

        String sqlUpdateMaster = "UPDATE sp_payment SET amount_paid = ?, balance_amount = ?, status = ? WHERE invoice_number = ? AND bill_number LIKE 'PUR-ENT%' AND school_id = ?";
        jdbc.update(sqlUpdateMaster, newPaidTotal, newBalance, newStatus, dto.getInvoiceNo(), schoolId);

        // 3. SpPaymentIndividual (Transaction History)
        String sqlInsertHistory = "INSERT INTO sp_payment_individual (payment_date, entry_no, invoice_number, supplier_code, gross_amount, settlement_amount, discount_amount, net_cash_paid, payment_mode, school_id, academic_year) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
        jdbc.update(sqlInsertHistory,
                dto.getPaymentDate(),
                entryNo,
                dto.getInvoiceNo(),
                dto.getSupplierCode(),
                dto.getOriginalGrossAmount(),
                dto.getSettlementAmount(),
                dto.getDiscountAmount(),
                dto.getNetCashPaid(),
                dto.getPaymentMode(),
                schoolId,
                year
        );

        return entryNo;
    }
}