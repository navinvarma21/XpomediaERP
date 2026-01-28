package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.MaterialIssueDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class UtiliseService {

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
        // 1. SP Sales Daily (Staff/Material Issue Log) - UPDATED with bank details
        jdbc.execute("CREATE TABLE IF NOT EXISTS sp_sales_daily (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "bill_no VARCHAR(50), " +
                "bill_num VARCHAR(50), " +
                "customer_name VARCHAR(255), " +
                "address VARCHAR(255), " +
                "rate DOUBLE, " +
                "quantity INT, " +
                "total_amount DOUBLE, " +
                "issue_date DATE, " +
                "gst_amount DOUBLE, " +
                "item_name VARCHAR(255), " +
                "item_code VARCHAR(50), " +
                "bill_time TIME, " +
                "month VARCHAR(20), " +
                "customer_code VARCHAR(50), " +
                "payment_mode VARCHAR(50), " +
                "transaction_ref_no VARCHAR(100), " + // NEW: For Cheque/DD/Online reference
                "bank_account_id BIGINT, " + // NEW: Bank account ID
                "bank_name VARCHAR(255), " + // NEW: Bank name
                "account_number VARCHAR(50), " + // NEW: Account number
                "ifsc_code VARCHAR(50), " + // NEW: IFSC code
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");

        // 2. SPR Sales (Reporting Table) - UPDATED with bank details
        jdbc.execute("CREATE TABLE IF NOT EXISTS spr_sales (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "bill_no VARCHAR(50), " +
                "bill_num VARCHAR(50), " +
                "customer_name VARCHAR(255), " +
                "address VARCHAR(255), " +
                "rate DOUBLE, " +
                "quantity INT, " +
                "total_amount DOUBLE, " +
                "issue_date DATE, " +
                "item_name VARCHAR(255), " +
                "bill_time TIME, " +
                "month VARCHAR(20), " +
                "payment_mode VARCHAR(50), " + // NEW
                "transaction_ref_no VARCHAR(100), " + // NEW
                "bank_name VARCHAR(255), " + // NEW
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");

        // 3. Stock Report
        jdbc.execute("CREATE TABLE IF NOT EXISTS stock_report (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "description_name VARCHAR(255), " +
                "date DATE, " +
                "quantity INT, " +
                "standard VARCHAR(50), " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");

        // 4. Material Bank Payment Details (NEW)
        jdbc.execute("CREATE TABLE IF NOT EXISTS material_bank_payments (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "bill_no VARCHAR(50), " +
                "bank_account_id BIGINT, " +
                "bank_name VARCHAR(255), " +
                "account_number VARCHAR(50), " +
                "ifsc_code VARCHAR(50), " +
                "account_type VARCHAR(50), " +
                "branch_name VARCHAR(100), " +
                "transaction_date DATE, " +
                "transaction_time TIME, " +
                "amount DOUBLE, " +
                "customer_name VARCHAR(255), " +
                "status VARCHAR(20) DEFAULT 'COMPLETED', " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");
    }

    // List items for dropdown that have stock > 0
    public java.util.List<Map<String, Object>> getAllItemsWithStock(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String sql = "SELECT item_code as code, item_name as name, total_quantity as stock, purchase_rate as sellPrice, gst_percent as gst FROM stock WHERE total_quantity > 0 AND school_id = ?";
        try {
            return jdbc.queryForList(sql, schoolId);
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    public String generateBillNo(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        try {
            ensureTablesExist(jdbc);
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM sp_sales_daily", Integer.class);
            return "MAT-" + (count != null ? count + 1 : 1);
        } catch (Exception e) {
            return "MAT-1";
        }
    }

    @Transactional
    public String saveMaterialIssue(String schoolId, String year, MaterialIssueDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        String billNo = generateBillNo(schoolId);
        LocalTime nowTime = LocalTime.now();
        String currentMonth = dto.getIssueDate().getMonth().toString();

        // Extract bank details if payment mode is Bank Transfer
        Map<String, Object> bankAccountInfo = null;
        Long bankAccountId = null;

        if ("Bank Transfer".equalsIgnoreCase(dto.getPaymentMode()) && dto.getBankAccountDetails() != null) {
            try {
                Map<String, Object> bankDetails = dto.getBankAccountDetails();
                bankAccountInfo = (Map<String, Object>) bankDetails.get("bankAccountInfo");
                bankAccountId = bankDetails.get("bankAccountId") != null ?
                        Long.valueOf(bankDetails.get("bankAccountId").toString()) : null;
            } catch (Exception e) {
                log.error("Error parsing bank account details: ", e);
            }
        }

        // SQL for sp_sales_daily - UPDATED with bank columns
        String sqlSpSalesDaily = "INSERT INTO sp_sales_daily (" +
                "bill_no, bill_num, customer_name, address, rate, quantity, total_amount, " +
                "issue_date, gst_amount, item_name, item_code, bill_time, month, " +
                "customer_code, payment_mode, transaction_ref_no, " +
                "bank_account_id, bank_name, account_number, ifsc_code, " +
                "school_id, academic_year) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        // SQL for spr_sales - UPDATED with payment details
        String sqlSprSales = "INSERT INTO spr_sales (" +
                "bill_no, bill_num, customer_name, address, rate, quantity, total_amount, " +
                "issue_date, item_name, bill_time, month, " +
                "payment_mode, transaction_ref_no, bank_name, " +
                "school_id, academic_year) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        // SQL to update Stock
        String updateStockSql = "UPDATE stock SET total_quantity = total_quantity - ? WHERE item_code = ? AND item_name = ? AND school_id = ?";

        // SQL for stock_report
        String insertStockReportSql = "INSERT INTO stock_report (description_name, date, quantity, standard, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?)";

        for (MaterialIssueDTO.IssueItemEntry item : dto.getItems()) {
            if (item.getQuantity() > 0) {
                // 1. Check Stock
                try {
                    String checkStockSql = "SELECT total_quantity FROM stock WHERE item_code = ? AND item_name = ? AND school_id = ?";
                    Integer currentStock = jdbc.queryForObject(checkStockSql, Integer.class, item.getItemCode(), item.getItemName(), schoolId);
                    if (currentStock == null || currentStock < item.getQuantity()) {
                        throw new RuntimeException("Insufficient stock for item: " + item.getItemName());
                    }
                } catch (Exception e) {
                    if(e.getMessage().contains("Insufficient")) throw e;
                    throw new RuntimeException("Insufficient stock / Item not found: " + item.getItemName());
                }

                Double gstPercent = item.getGstPercent() != null ? item.getGstPercent() : 0.0;
                double baseTotal = item.getRate() * item.getQuantity();
                double gstAmount = (baseTotal * gstPercent) / 100.0;

                // 2. Insert into sp_sales_daily with all payment details
                jdbc.update(sqlSpSalesDaily,
                        billNo, billNo,
                        dto.getCustomerName(), dto.getAddress(),
                        item.getRate(), item.getQuantity(), item.getTotal(),
                        dto.getIssueDate(), gstAmount,
                        item.getItemName(), item.getItemCode(),
                        nowTime, currentMonth,
                        dto.getCustomerCode(), dto.getPaymentMode(),
                        dto.getTransactionRefNo(), // Reference number for Cheque/DD/Online
                        bankAccountId, // Bank account ID
                        bankAccountInfo != null ? bankAccountInfo.get("bankName") : null, // Bank name
                        bankAccountInfo != null ? bankAccountInfo.get("accountNumber") : null, // Account number
                        bankAccountInfo != null ? bankAccountInfo.get("ifscCode") : null, // IFSC code
                        schoolId, year);

                // 3. Insert into spr_sales with payment details
                jdbc.update(sqlSprSales,
                        billNo, billNo,
                        dto.getCustomerName(), dto.getAddress(),
                        item.getRate(), item.getQuantity(), item.getTotal(),
                        dto.getIssueDate(),
                        item.getItemName(),
                        nowTime, currentMonth,
                        dto.getPaymentMode(),
                        dto.getTransactionRefNo(),
                        bankAccountInfo != null ? bankAccountInfo.get("bankName") : null,
                        schoolId, year);

                // 4. Insert into stock_report
                // We use "Staff" as the standard for these transactions
                jdbc.update(insertStockReportSql,
                        item.getItemName(),  // description_name
                        dto.getIssueDate(),  // date
                        item.getQuantity(),  // quantity
                        "Staff",             // standard
                        schoolId,
                        year);

                // 5. Deduct Stock
                jdbc.update(updateStockSql, item.getQuantity(), item.getItemCode(), item.getItemName(), schoolId);
            }
        }

        // 6. Save separate bank payment details if payment mode is Bank Transfer
        if ("Bank Transfer".equalsIgnoreCase(dto.getPaymentMode()) && bankAccountInfo != null) {
            try {
                String insertBankPaymentSql = "INSERT INTO material_bank_payments (" +
                        "bill_no, bank_account_id, bank_name, account_number, ifsc_code, " +
                        "account_type, branch_name, transaction_date, transaction_time, amount, " +
                        "customer_name, school_id, academic_year) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                jdbc.update(insertBankPaymentSql,
                        billNo,
                        bankAccountId,
                        bankAccountInfo.get("bankName"),
                        bankAccountInfo.get("accountNumber"),
                        bankAccountInfo.get("ifscCode"),
                        bankAccountInfo.get("accountType"),
                        bankAccountInfo.get("branchName"),
                        dto.getIssueDate(),
                        nowTime,
                        dto.getNetAmount(), // Net amount
                        dto.getCustomerName(),
                        schoolId,
                        year);
            } catch (Exception e) {
                log.error("Error saving bank payment details for material issue: ", e);
                // Continue with transaction even if bank details fail
            }
        }

        return billNo;
    }
}