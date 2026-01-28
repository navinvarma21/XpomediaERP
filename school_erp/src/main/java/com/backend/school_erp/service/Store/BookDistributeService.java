package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.BookDistributionDTO;
import com.backend.school_erp.config.DatabaseConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class BookDistributeService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            try {
                HikariConfig config = new HikariConfig();
                config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
                config.setUsername(DatabaseConfig.AWS_DB_USER);
                config.setPassword(DatabaseConfig.AWS_DB_PASS);
                config.setDriverClassName("com.mysql.cj.jdbc.Driver");
                return new HikariDataSource(config);
            } catch (Exception e) {
                log.error("Error creating DataSource for schoolId: " + id, e);
                throw new RuntimeException("Database connection failed for school: " + id);
            }
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    /**
     * Ensures all necessary tables exist with proper payment mode columns.
     */
    private void ensureTablesExist(JdbcTemplate jdbc) {
        // 1. Notebook Table (Main Transaction Table) - UPDATED with payment mode columns
        jdbc.execute("CREATE TABLE IF NOT EXISTS notebook (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "bill_no VARCHAR(50), " +
                "bill_num VARCHAR(50), " +
                "fee_date DATE, " +
                "quantity INT, " +
                "total_amount DOUBLE, " +
                "admission_no VARCHAR(50), " +
                "operator_no VARCHAR(50), " +
                "description_name VARCHAR(255), " +
                "student_name VARCHAR(255), " +
                "standard VARCHAR(50), " +
                "section VARCHAR(50), " +
                "paymode VARCHAR(50), " +  // NEW: Store payment mode for each item
                "ddcheck_no VARCHAR(100), " + // NEW: Store cheque/DD number
                "bank_account_id BIGINT, " + // NEW: Store bank account ID
                "bank_name VARCHAR(255), " + // NEW: Store bank name
                "account_number VARCHAR(50), " + // NEW: Store account number
                "ifsc_code VARCHAR(50), " + // NEW: Store IFSC code
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");

        // 2. Notebook PayDetails (Payment Summary) - UPDATED with all payment details
        jdbc.execute("CREATE TABLE IF NOT EXISTS notebook_paydetails (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "total_amount_paid DOUBLE, " +
                "concession_amount DOUBLE, " +
                "admission_no VARCHAR(50), " +
                "bill_no VARCHAR(50), " +
                "student_name VARCHAR(255), " +
                "standard VARCHAR(50), " +
                "section VARCHAR(50), " +
                "paymode VARCHAR(50), " +
                "ddcheck_no VARCHAR(100), " +
                "bill_date DATE, " +
                "bill_time TIME, " +
                "bank_account_id BIGINT, " + // NEW: Store bank account ID
                "bank_name VARCHAR(255), " + // NEW: Store bank name
                "account_number VARCHAR(50), " + // NEW: Store account number
                "ifsc_code VARCHAR(50), " + // NEW: Store IFSC code
                "account_type VARCHAR(50), " + // NEW: Store account type
                "branch_name VARCHAR(100), " + // NEW: Store branch name
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");

        // 3. Stock Report Table
        jdbc.execute("CREATE TABLE IF NOT EXISTS stock_report (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "description_name VARCHAR(255), " +
                "date DATE, " +
                "quantity INT, " +
                "standard VARCHAR(50), " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");

        // 4. Bank Payment Details Table (for separate tracking if needed)
        jdbc.execute("CREATE TABLE IF NOT EXISTS bank_payment_details (" +
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
                "status VARCHAR(20) DEFAULT 'COMPLETED', " +
                "school_id VARCHAR(50), " +
                "academic_year VARCHAR(20))");
    }

    // --- Grid 1: Get Setup Items (What the student SHOULD have) ---
    public List<Map<String, Object>> getSetupItemsForStandard(String schoolId, String academicYear, String standard) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String sql = "SELECT book_id as descriptionName, quantity as requiredQty, amount, " +
                "(SELECT total_quantity FROM stock WHERE item_name = book_setup_classes.book_id AND school_id = ?) as currentStock " +
                "FROM book_setup_classes " +
                "WHERE standard = ? AND academic_year = ?";
        return jdbc.queryForList(sql, schoolId, standard, academicYear);
    }

    // --- Grid 2: Get Student History (What the student ALREADY has) ---
    public List<Map<String, Object>> getStudentTransactionHistory(String schoolId, String academicYear, String admissionNo) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        String sql = "SELECT fee_date as feeDate, bill_no as billNo, description_name as descriptionName, " +
                "quantity, paymode, ddcheck_no, bank_name, account_number " +
                "FROM notebook " +
                "WHERE admission_no = ? AND academic_year = ? " +
                "ORDER BY fee_date DESC, bill_no DESC";
        return jdbc.queryForList(sql, admissionNo, academicYear);
    }

    private String generateBillNo(JdbcTemplate jdbc) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM notebook_paydetails", Integer.class);
        return "NB-" + (count != null ? count + 1 : 1);
    }

    @Transactional
    public String saveDistribution(String schoolId, String academicYear, BookDistributionDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc);

        String newBillNo = generateBillNo(jdbc);
        double grandTotal = 0.0;

        // Extract bank details if payment mode is Bank Transfer
        Map<String, Object> bankAccountInfo = null;
        Long bankAccountId = null;

        if ("Bank Transfer".equalsIgnoreCase(dto.getPaymode()) && dto.getBankAccountDetails() != null) {
            try {
                Map<String, Object> bankDetails = dto.getBankAccountDetails();
                bankAccountInfo = (Map<String, Object>) bankDetails.get("bankAccountInfo");
                bankAccountId = bankDetails.get("bankAccountId") != null ?
                        Long.valueOf(bankDetails.get("bankAccountId").toString()) : null;
            } catch (Exception e) {
                log.error("Error parsing bank account details: ", e);
            }
        }

        // SQL Queries - UPDATED with payment mode columns
        String insertNotebookSql = "INSERT INTO notebook (" +
                "bill_no, bill_num, fee_date, quantity, total_amount, admission_no, " +
                "operator_no, description_name, student_name, standard, section, " +
                "paymode, ddcheck_no, bank_account_id, bank_name, account_number, ifsc_code, " +
                "school_id, academic_year) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        String updateStockSql = "UPDATE stock SET total_quantity = total_quantity - ? WHERE item_name = ? AND school_id = ?";

        String insertStockReportSql = "INSERT INTO stock_report (description_name, date, quantity, standard, school_id, academic_year) VALUES (?, ?, ?, ?, ?, ?)";

        for (BookDistributionDTO.ItemEntry item : dto.getItems()) {
            if (item.getQuantity() <= 0) continue;

            // Check Stock
            try {
                String checkStockSql = "SELECT total_quantity FROM stock WHERE item_name = ? AND school_id = ?";
                Integer currentStock = jdbc.queryForObject(checkStockSql, Integer.class, item.getDescriptionName(), schoolId);
                if (currentStock == null || currentStock < item.getQuantity()) {
                    log.warn("Stock low for: " + item.getDescriptionName());
                }
            } catch (Exception e) {
                log.warn("Stock check failed for item: " + item.getDescriptionName(), e);
            }

            double lineTotal = item.getQuantity() * item.getAmount();
            grandTotal += lineTotal;

            // 1. Save to 'notebook' with payment details
            jdbc.update(insertNotebookSql,
                    newBillNo, newBillNo, dto.getFeeDate(),
                    item.getQuantity(), lineTotal,
                    dto.getAdmissionNo(), dto.getOperatorNo(),
                    item.getDescriptionName(), dto.getStudentName(),
                    dto.getStandard(), dto.getSection(),
                    dto.getPaymode(), // Payment mode
                    dto.getDdcheckNo(), // Cheque/DD number
                    bankAccountId, // Bank account ID
                    bankAccountInfo != null ? bankAccountInfo.get("bankName") : null, // Bank name
                    bankAccountInfo != null ? bankAccountInfo.get("accountNumber") : null, // Account number
                    bankAccountInfo != null ? bankAccountInfo.get("ifscCode") : null, // IFSC code
                    schoolId,
                    academicYear);

            // 2. Save to 'stock_report'
            jdbc.update(insertStockReportSql,
                    item.getDescriptionName(),
                    dto.getFeeDate(),
                    item.getQuantity(),
                    dto.getStandard(),
                    schoolId,
                    academicYear);

            // 3. Deduct from 'stock'
            jdbc.update(updateStockSql, item.getQuantity(), item.getDescriptionName(), schoolId);
        }

        // 4. Save Payment Summary to notebook_paydetails - UPDATED with all bank details
        String insertPayDetailsSql = "INSERT INTO notebook_paydetails (" +
                "total_amount_paid, concession_amount, admission_no, bill_no, " +
                "student_name, standard, section, paymode, ddcheck_no, bill_date, bill_time, " +
                "bank_account_id, bank_name, account_number, ifsc_code, account_type, branch_name, " +
                "school_id, academic_year) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        jdbc.update(insertPayDetailsSql,
                grandTotal, dto.getConcessionAmount(),
                dto.getAdmissionNo(), newBillNo,
                dto.getStudentName(), dto.getStandard(), dto.getSection(),
                dto.getPaymode(), dto.getDdcheckNo(),
                dto.getFeeDate(), LocalTime.now(),
                bankAccountId, // Bank account ID
                bankAccountInfo != null ? bankAccountInfo.get("bankName") : null, // Bank name
                bankAccountInfo != null ? bankAccountInfo.get("accountNumber") : null, // Account number
                bankAccountInfo != null ? bankAccountInfo.get("ifscCode") : null, // IFSC code
                bankAccountInfo != null ? bankAccountInfo.get("accountType") : null, // Account type
                bankAccountInfo != null ? bankAccountInfo.get("branchName") : null, // Branch name
                schoolId,
                academicYear);

        // 5. Save separate bank payment details if payment mode is Bank Transfer
        if ("Bank Transfer".equalsIgnoreCase(dto.getPaymode()) && bankAccountInfo != null) {
            try {
                String insertBankPaymentSql = "INSERT INTO bank_payment_details (" +
                        "bill_no, bank_account_id, bank_name, account_number, ifsc_code, " +
                        "account_type, branch_name, transaction_date, transaction_time, amount, " +
                        "school_id, academic_year) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                jdbc.update(insertBankPaymentSql,
                        newBillNo,
                        bankAccountId,
                        bankAccountInfo.get("bankName"),
                        bankAccountInfo.get("accountNumber"),
                        bankAccountInfo.get("ifscCode"),
                        bankAccountInfo.get("accountType"),
                        bankAccountInfo.get("branchName"),
                        dto.getFeeDate(),
                        LocalTime.now(),
                        grandTotal - dto.getConcessionAmount(), // Net amount
                        schoolId,
                        academicYear);
            } catch (Exception e) {
                log.error("Error saving separate bank payment details: ", e);
                // Continue with transaction even if bank details fail
            }
        }

        return newBillNo;
    }
}