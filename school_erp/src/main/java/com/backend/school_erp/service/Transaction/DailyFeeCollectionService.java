package com.backend.school_erp.service.Transaction;

import com.backend.school_erp.DTO.Transaction.DailyFeeCollectionDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Transaction.DailyFeeCollection;
import com.backend.school_erp.entity.Transaction.DFCPaidAmount;
import com.backend.school_erp.entity.Transaction.DFCConcession;
import com.backend.school_erp.entity.Transaction.DayBook;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class DailyFeeCollectionService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating HikariCP DataSource for school: {}", id);
            HikariConfig config = new HikariConfig();

            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");

            config.setMaximumPoolSize(15);
            config.setMinimumIdle(5);
            config.setIdleTimeout(30000);
            config.setMaxLifetime(1800000);
            config.setConnectionTimeout(30000);
            config.setValidationTimeout(5000);
            config.setLeakDetectionThreshold(10000);

            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private void ensureTablesExist(JdbcTemplate jdbc) {
        try {
            // 1. Create daily_fee_collection table (master table) - NO CHANGES
            String createDailyFeeCollection = """
                CREATE TABLE IF NOT EXISTS daily_fee_collection (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    bill_number VARCHAR(100) NOT NULL,
                    admission_number VARCHAR(50) NOT NULL,
                    student_name VARCHAR(255) NOT NULL,
                    father_name VARCHAR(255),
                    standard VARCHAR(50),
                    section VARCHAR(50),
                    emis_no VARCHAR(50),
                    aadhar_no VARCHAR(50),
                    boarding_point VARCHAR(255),
                    bill_date TIMESTAMP NOT NULL,
                    fee_head VARCHAR(255) NOT NULL,
                    account_head VARCHAR(255) NOT NULL,
                    paid_amount DECIMAL(12,2) DEFAULT 0.00,
                    concession_amount DECIMAL(12,2) DEFAULT 0.00,
                    net_paid_amount DECIMAL(12,2) DEFAULT 0.00,
                    payment_mode VARCHAR(50) NOT NULL,
                    payment_number VARCHAR(100),
                    operator_name VARCHAR(255) NOT NULL,
                    transaction_narrative TEXT,
                    transaction_date TIMESTAMP,
                    route_number VARCHAR(100),
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_bill_fee_admission (bill_number, fee_head, admission_number),
                    INDEX idx_bill_number (bill_number),
                    INDEX idx_admission_number (admission_number),
                    INDEX idx_school_academic (school_id, academic_year),
                    INDEX idx_bill_date (bill_date),
                    INDEX idx_fee_head (fee_head),
                    INDEX idx_student_name (student_name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """;

            // 2. Create dfcpaidamount table - NO CHANGES
            String createDFCPaidAmount = """
                CREATE TABLE IF NOT EXISTS dfcpaidamount (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    bill_number VARCHAR(100) NOT NULL,
                    admission_number VARCHAR(50) NOT NULL,
                    amount DECIMAL(12,2) NOT NULL,
                    student_name VARCHAR(255) NOT NULL,
                    father_name VARCHAR(255),
                    standard VARCHAR(50),
                    section VARCHAR(50),
                    school_id VARCHAR(50) NOT NULL,
                    aadhar_no VARCHAR(50),
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_bill_number (bill_number),
                    INDEX idx_admission_number (admission_number),
                    INDEX idx_school_year (school_id, academic_year),
                    INDEX idx_student_name (student_name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """;

            // 3. Create dfcconcession table - NO CHANGES
            String createDFCConcession = """
                CREATE TABLE IF NOT EXISTS dfcconcession (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    bill_number VARCHAR(100) NOT NULL,
                    admission_number VARCHAR(50) NOT NULL,
                    concession_amount DECIMAL(12,2) NOT NULL,
                    school_id VARCHAR(50) NOT NULL,
                    student_name VARCHAR(255) NOT NULL,
                    father_name VARCHAR(255),
                    standard VARCHAR(50),
                    section VARCHAR(50),
                    aadhar_no VARCHAR(50),
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_bill_number (bill_number),
                    INDEX idx_admission_number (admission_number),
                    INDEX idx_school_year (school_id, academic_year),
                    INDEX idx_student_name (student_name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """;

            // 4. Create day_book table - UPDATED WITH NEW COLUMNS
            String createDayBook = """
                CREATE TABLE IF NOT EXISTS day_book (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    br_number VARCHAR(100) NOT NULL,  -- Changed from bill_number
                    admission_number VARCHAR(50) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    br_date TIMESTAMP NOT NULL,  -- Changed from bill_date
                    description VARCHAR(500),
                    ledger VARCHAR(255),  -- NEW COLUMN: stores fee head
                    credit DECIMAL(12,2) DEFAULT 0.00,
                    debit DECIMAL(12,2) DEFAULT 0.00,
                    mode VARCHAR(50) NOT NULL,
                    operator_name VARCHAR(255) NOT NULL,
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_br_number (br_number),
                    INDEX idx_admission_number (admission_number),
                    INDEX idx_school_academic (school_id, academic_year),
                    INDEX idx_br_date (br_date),
                    INDEX idx_name (name),
                    INDEX idx_ledger (ledger)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """;

            jdbc.execute(createDailyFeeCollection);
            jdbc.execute(createDFCPaidAmount);
            jdbc.execute(createDFCConcession);
            jdbc.execute(createDayBook);

            log.info("✅ All 4 billing tables created or already exist for school");
        } catch (Exception e) {
            log.error("❌ Failed to create billing tables: {}", e.getMessage());
            throw new RuntimeException("Database table creation failed: " + e.getMessage(), e);
        }
    }

    // Get student fee details with proper payment history calculation
    public Map<String, Object> getStudentFeeDetails(String schoolId, String admissionNumber, String academicYear) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> feeDetails = new ArrayList<>();

        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            // Get student info
            Map<String, Object> studentInfo = getStudentInfo(jdbc, schoolId, admissionNumber, academicYear);

            // Get all fee tables for the academic year
            List<String> feeTables = Arrays.asList(
                    "tuition_fees_" + academicYear.replaceAll("[^a-zA-Z0-9]", "_"),
                    "hostel_fees_" + academicYear.replaceAll("[^a-zA-Z0-9]", "_"),
                    "transport_fees_" + academicYear.replaceAll("[^a-zA-Z0-9]", "_")
            );

            // Collect all fees from different tables
            for (String tableName : feeTables) {
                if (tableExists(jdbc, tableName)) {
                    String sql = String.format("""
                        SELECT 
                            fee_heading as heading,
                            account_head as accountHead,
                            amount as originalAmount,
                            status,
                            CASE 
                                WHEN LOWER(?) LIKE '%%tuition%%' THEN 'Tuition'
                                WHEN LOWER(?) LIKE '%%hostel%%' THEN 'Hostel'
                                WHEN LOWER(?) LIKE '%%transport%%' THEN 'Transport'
                                ELSE 'Academic'
                            END as feeType,
                            CASE 
                                WHEN LOWER(?) LIKE '%%tuition%%' THEN 'Academic'
                                WHEN LOWER(?) LIKE '%%hostel%%' THEN 'Hostel'
                                WHEN LOWER(?) LIKE '%%transport%%' THEN 'Transport'
                                ELSE 'Academic'
                            END as type
                        FROM %s 
                        WHERE admission_number = ? AND school_id = ? 
                        AND (status IS NULL OR status != 'settled')
                    """, tableName);

                    List<Map<String, Object>> fees = jdbc.queryForList(sql,
                            tableName, tableName, tableName, tableName, tableName, tableName,
                            admissionNumber, schoolId);

                    for (Map<String, Object> fee : fees) {
                        // Convert all numeric values properly
                        fee.put("originalAmount", convertToDouble(fee.get("originalAmount")));
                        fee.put("remainingBalance", convertToDouble(fee.get("originalAmount")));
                        fee.put("previousPaid", 0.0);
                        fee.put("previousConcession", 0.0);
                        fee.put("aadharNo", studentInfo.getOrDefault("aadharNo", ""));
                        fee.put("emisNo", studentInfo.getOrDefault("emisNo", ""));
                        feeDetails.add(fee);
                    }
                }
            }

            // Adjust balances with payment history
            if (!feeDetails.isEmpty()) {
                feeDetails = adjustRemainingBalancesWithPaymentHistory(jdbc, schoolId, admissionNumber, academicYear, feeDetails);
            }

            // Calculate totals
            double totalFees = feeDetails.stream()
                    .mapToDouble(fee -> convertToDouble(fee.get("originalAmount")))
                    .sum();

            double totalRemainingBalance = feeDetails.stream()
                    .mapToDouble(fee -> convertToDouble(fee.get("remainingBalance")))
                    .sum();

            result.put("feeDetails", feeDetails);
            result.put("totalFees", totalFees);
            result.put("totalRemainingBalance", totalRemainingBalance);

            log.info("✅ Found {} fee details for admission {} with total: {}, remaining: {}",
                    feeDetails.size(), admissionNumber, totalFees, totalRemainingBalance);

        } catch (Exception e) {
            log.error("❌ Error fetching student fee details for admission {}: {}", admissionNumber, e.getMessage());
            result.put("feeDetails", new ArrayList<>());
            result.put("totalFees", 0.0);
            result.put("totalRemainingBalance", 0.0);
        }

        return result;
    }

    // Get student info with EMIS and Aadhar
    private Map<String, Object> getStudentInfo(JdbcTemplate jdbc, String schoolId, String admissionNumber, String academicYear) {
        Map<String, Object> studentInfo = new HashMap<>();

        try {
            // Try multiple table sources
            String[] possibleTables = {
                    "student_master",
                    "admissions_" + academicYear.replaceAll("-", "_"),
                    "students"
            };

            for (String table : possibleTables) {
                if (tableExists(jdbc, table)) {
                    String sql = "";
                    if (table.equals("admissions_" + academicYear.replaceAll("-", "_"))) {
                        sql = String.format("""
                            SELECT 
                                COALESCE(aadhar_number, '') as aadhar_no,
                                COALESCE(emis, '') as emis_no,
                                COALESCE(student_name, '') as student_name,
                                COALESCE(father_name, '') as father_name,
                                COALESCE(standard, '') as standard,
                                COALESCE(section, '') as section,
                                COALESCE(boarding_point, '') as boarding_point
                            FROM %s 
                            WHERE school_id = ? AND admission_number = ?
                            LIMIT 1
                        """, table);
                    } else {
                        sql = String.format("""
                            SELECT 
                                COALESCE(aadhar_no, '') as aadhar_no,
                                COALESCE(emis_no, '') as emis_no,
                                COALESCE(student_name, '') as student_name,
                                COALESCE(father_name, '') as father_name,
                                COALESCE(standard, '') as standard,
                                COALESCE(section, '') as section,
                                COALESCE(boarding_point, '') as boarding_point
                            FROM %s 
                            WHERE school_id = ? AND admission_number = ?
                            LIMIT 1
                        """, table);
                    }

                    try {
                        studentInfo = jdbc.queryForMap(sql, schoolId, admissionNumber);
                        log.info("✅ Found student info in table: {}", table);
                        break;
                    } catch (Exception e) {
                        continue; // Try next table
                    }
                }
            }

            // Ensure all fields exist
            studentInfo.putIfAbsent("aadhar_no", "");
            studentInfo.putIfAbsent("emis_no", "");
            studentInfo.putIfAbsent("student_name", "");
            studentInfo.putIfAbsent("father_name", "");
            studentInfo.putIfAbsent("standard", "");
            studentInfo.putIfAbsent("section", "");
            studentInfo.putIfAbsent("boarding_point", "");

        } catch (Exception e) {
            log.warn("⚠️ Student info not found for {}: {}", admissionNumber, e.getMessage());
            // Return default info
            studentInfo.put("aadhar_no", "");
            studentInfo.put("emis_no", "");
            studentInfo.put("student_name", "");
            studentInfo.put("father_name", "");
            studentInfo.put("standard", "");
            studentInfo.put("section", "");
            studentInfo.put("boarding_point", "");
        }

        return studentInfo;
    }

    // Check if table exists
    private boolean tableExists(JdbcTemplate jdbc, String tableName) {
        try {
            String sql = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = LOWER(?)";
            Integer count = jdbc.queryForObject(sql, Integer.class, tableName.toLowerCase());
            return count != null && count > 0;
        } catch (Exception e) {
            log.debug("Table {} does not exist: {}", tableName, e.getMessage());
            return false;
        }
    }

    // Adjust remaining balances based on payment history
    private List<Map<String, Object>> adjustRemainingBalancesWithPaymentHistory(
            JdbcTemplate jdbc, String schoolId, String admissionNumber,
            String academicYear, List<Map<String, Object>> feeDetails) {

        try {
            // Get all payments for this student
            String paidSql = """
                SELECT 
                    fee_head, 
                    SUM(COALESCE(paid_amount, 0)) as total_paid,
                    SUM(COALESCE(concession_amount, 0)) as total_concession
                FROM daily_fee_collection 
                WHERE school_id = ? AND admission_number = ? AND academic_year = ?
                GROUP BY fee_head
            """;

            Map<String, Map<String, Double>> feeTotals = new HashMap<>();
            List<Map<String, Object>> paymentResults = jdbc.queryForList(paidSql, schoolId, admissionNumber, academicYear);

            for (Map<String, Object> row : paymentResults) {
                String feeHead = (String) row.get("fee_head");
                Double totalPaid = convertToDouble(row.get("total_paid"));
                Double totalConcession = convertToDouble(row.get("total_concession"));

                Map<String, Double> totals = new HashMap<>();
                totals.put("paid", totalPaid);
                totals.put("concession", totalConcession);
                feeTotals.put(feeHead, totals);
            }

            // Update fee details with payment history
            for (Map<String, Object> fee : feeDetails) {
                String heading = (String) fee.get("heading");
                Double originalAmount = convertToDouble(fee.get("originalAmount"));

                Double totalPaid = 0.0;
                Double totalConcession = 0.0;

                if (feeTotals.containsKey(heading)) {
                    Map<String, Double> totals = feeTotals.get(heading);
                    totalPaid = totals.getOrDefault("paid", 0.0);
                    totalConcession = totals.getOrDefault("concession", 0.0);
                }

                Double remainingBalance = originalAmount - totalPaid - totalConcession;
                if (remainingBalance < 0) {
                    remainingBalance = 0.0; // Ensure non-negative balance
                }

                fee.put("previousPaid", totalPaid);
                fee.put("previousConcession", totalConcession);
                fee.put("remainingBalance", remainingBalance);
                fee.put("status", remainingBalance <= 0.01 ? "Settled" : "Pending");
            }

            log.info("✅ Adjusted balances for {} fee heads", feeDetails.size());
            return feeDetails;

        } catch (Exception e) {
            log.error("❌ Error adjusting balances with payment history: {}", e.getMessage());
            return feeDetails;
        }
    }

    // Main payment processing method - UPDATED FOR DAY_BOOK CHANGES
    @Transactional(rollbackFor = Exception.class)
    public DailyFeeCollection processPayment(String schoolId, DailyFeeCollectionDTO dto) {
        JdbcTemplate jdbc = null;
        DailyFeeCollection result = null;

        try {
            jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            // Validate required fields
            validatePaymentDTO(dto);

            // Get student info for additional fields
            Map<String, Object> studentInfo = getStudentInfo(jdbc, schoolId, dto.getAdmissionNumber(), dto.getAcademicYear());

            // Set default bill date if not provided
            LocalDateTime billDate = dto.getBillDate() != null ? dto.getBillDate() : LocalDateTime.now();
            LocalDateTime transactionDate = dto.getTransactionDate() != null ? dto.getTransactionDate() : billDate;

            // Process each fee payment
            for (DailyFeeCollectionDTO.FeePaymentDetailDTO feePayment : dto.getFeePayments()) {
                try {
                    // Calculate amounts
                    Double paidAmount = feePayment.getPaidAmount() != null ? feePayment.getPaidAmount() : 0.0;
                    Double concessionAmount = feePayment.getConcessionAmount() != null ? feePayment.getConcessionAmount() : 0.0;
                    Double netPaidAmount = paidAmount + concessionAmount;

                    // Insert into daily_fee_collection
                    String insertDailyFeeSQL = """
                        INSERT INTO daily_fee_collection (
                            bill_number, admission_number, student_name, father_name, 
                            standard, section, emis_no, aadhar_no, boarding_point, bill_date, 
                            fee_head, account_head, paid_amount, concession_amount, net_paid_amount, 
                            payment_mode, payment_number, operator_name, transaction_narrative, 
                            transaction_date, route_number, school_id, academic_year
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            paid_amount = paid_amount + VALUES(paid_amount),
                            concession_amount = concession_amount + VALUES(concession_amount),
                            net_paid_amount = net_paid_amount + VALUES(net_paid_amount),
                            operator_name = VALUES(operator_name),
                            transaction_narrative = VALUES(transaction_narrative),
                            transaction_date = VALUES(transaction_date)
                    """;

                    jdbc.update(insertDailyFeeSQL,
                            dto.getBillNumber(),
                            dto.getAdmissionNumber(),
                            dto.getStudentName(),
                            dto.getFatherName(),
                            dto.getStandard(),
                            dto.getSection(),
                            studentInfo.get("emis_no"),
                            studentInfo.get("aadhar_no"),
                            dto.getBoardingPoint(),
                            java.sql.Timestamp.valueOf(billDate),
                            feePayment.getFeeHeading(),
                            feePayment.getAccountHead(),
                            paidAmount,
                            concessionAmount,
                            netPaidAmount,
                            dto.getPaymentMode(),
                            dto.getPaymentNumber(),
                            dto.getOperatorName(),
                            dto.getTransactionNarrative(),
                            java.sql.Timestamp.valueOf(transactionDate),
                            dto.getRouteNumber(),
                            schoolId,
                            dto.getAcademicYear()
                    );

                    // Insert paid amounts into dfcpaidamount (if any paid amount)
                    if (paidAmount > 0) {
                        String insertPaidSQL = """
                            INSERT INTO dfcpaidamount (
                                bill_number, admission_number, amount, student_name, father_name, 
                                standard, section, school_id, aadhar_no, academic_year
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """;

                        jdbc.update(insertPaidSQL,
                                dto.getBillNumber(),
                                dto.getAdmissionNumber(),
                                paidAmount,
                                dto.getStudentName(),
                                dto.getFatherName(),
                                dto.getStandard(),
                                dto.getSection(),
                                schoolId,
                                studentInfo.get("aadhar_no"),
                                dto.getAcademicYear()
                        );
                    }

                    // Insert concessions into dfcconcession (if any concession)
                    if (concessionAmount > 0) {
                        String insertConcessionSQL = """
                            INSERT INTO dfcconcession (
                                bill_number, admission_number, concession_amount, school_id, student_name, 
                                father_name, standard, section, aadhar_no, academic_year
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """;

                        jdbc.update(insertConcessionSQL,
                                dto.getBillNumber(),
                                dto.getAdmissionNumber(),
                                concessionAmount,
                                schoolId,
                                dto.getStudentName(),
                                dto.getFatherName(),
                                dto.getStandard(),
                                dto.getSection(),
                                studentInfo.get("aadhar_no"),
                                dto.getAcademicYear()
                        );
                    }

                    // Insert into day_book - UPDATED FOR NEW SCHEMA
                    String insertDayBookSQL = """
                        INSERT INTO day_book (
                            br_number, admission_number, name, br_date, description, 
                            ledger, credit, debit, mode, operator_name, school_id, academic_year
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """;

                    // Create description with standard and section
                    String descriptionWithClass = dto.getStandard() + "-" + dto.getSection();

                    jdbc.update(insertDayBookSQL,
                            dto.getBillNumber(),  // br_number (same as bill_number)
                            dto.getAdmissionNumber(),
                            dto.getStudentName(),
                            java.sql.Timestamp.valueOf(billDate),  // br_date
                            descriptionWithClass,  // description now stores standard-section
                            feePayment.getFeeHeading(),  // ledger column stores fee head
                            paidAmount,  // credit
                            concessionAmount,  // debit
                            dto.getPaymentMode(),
                            dto.getOperatorName(),
                            schoolId,
                            dto.getAcademicYear()
                    );

                    // Update fee table amount and status
                    updateFeeTableAmountAndStatus(jdbc, schoolId, dto.getAdmissionNumber(), dto.getAcademicYear(), feePayment);

                } catch (Exception feeError) {
                    log.error("❌ Error processing fee payment {}: {}", feePayment.getFeeHeading(), feeError.getMessage());
                    throw new RuntimeException("Failed to process fee payment for " + feePayment.getFeeHeading() + ": " + feeError.getMessage(), feeError);
                }
            }

            // Get the created daily fee collection entry
            String selectSQL = """
                SELECT * FROM daily_fee_collection 
                WHERE bill_number = ? AND school_id = ? 
                ORDER BY created_at DESC LIMIT 1
            """;

            result = jdbc.queryForObject(selectSQL,
                    new BeanPropertyRowMapper<>(DailyFeeCollection.class),
                    dto.getBillNumber(), schoolId
            );

            log.info("✅ Successfully processed payment. Bill: {}, Student: {}, Amount: {}",
                    dto.getBillNumber(), dto.getAdmissionNumber(), dto.getNetPaidAmount());

            return result;

        } catch (Exception e) {
            log.error("❌ Error processing payment for bill {}: {}",
                    dto != null ? dto.getBillNumber() : "unknown", e.getMessage());
            log.error("Stack trace:", e);
            throw new RuntimeException("Failed to process payment: " + e.getMessage(), e);
        }
    }

    // Update fee tables STATUS only - DOES NOT DEDUCT AMOUNT (Fixes double deduction bug)
    private void updateFeeTableAmountAndStatus(JdbcTemplate jdbc, String schoolId, String admissionNumber,
                                               String academicYear, DailyFeeCollectionDTO.FeePaymentDetailDTO feePayment) {

        try {
            String feeHead = feePayment.getFeeHeading();

            // 1. Get the TOTAL amount paid so far for this fee head (from history)
            Double totalPaidSoFar = getTotalPaidConcessionForFeeHead(jdbc, schoolId, admissionNumber, academicYear, feeHead);

            log.info("🔄 Checking status for {}: Total Paid So Far={}", feeHead, totalPaidSoFar);

            // Update all fee tables that might contain this fee head
            String[] feeTables = {
                    "tuition_fees_" + academicYear.replaceAll("[^a-zA-Z0-9]", "_"),
                    "hostel_fees_" + academicYear.replaceAll("[^a-zA-Z0-9]", "_"),
                    "transport_fees_" + academicYear.replaceAll("[^a-zA-Z0-9]", "_")
            };

            for (String table : feeTables) {
                if (tableExists(jdbc, table)) {
                    try {
                        // 2. Get the ORIGINAL TOTAL AMOUNT from the fee table
                        String getFeeSQL = String.format("""
                            SELECT amount, status FROM %s 
                            WHERE school_id = ? AND admission_number = ? AND fee_heading = ?
                            LIMIT 1
                        """, table);

                        Map<String, Object> feeRecord = jdbc.queryForMap(getFeeSQL, schoolId, admissionNumber, feeHead);
                        Double originalTotalAmount = convertToDouble(feeRecord.get("amount"));
                        String currentStatus = (String) feeRecord.get("status");

                        log.info("📊 Fee record in {} - Amount: {}, Status: {}", table, originalTotalAmount, currentStatus);

                        if (originalTotalAmount != null && originalTotalAmount > 0) {

                            // 3. Calculate Real Balance: Original Amount - Total Paid History
                            Double realBalance = originalTotalAmount - totalPaidSoFar;

                            // Determine new status based on real balance
                            String newStatus = "pending";
                            if (realBalance <= 0.01) { // Allow small rounding differences
                                newStatus = "settled";
                            }

                            // 4. Update ONLY the status. DO NOT update the 'amount' column.
                            if (!newStatus.equalsIgnoreCase(currentStatus)) {
                                String updateSQL = String.format("""
                                    UPDATE %s 
                                    SET status = ? 
                                    WHERE school_id = ? AND admission_number = ? AND fee_heading = ?
                                """, table);

                                int updatedRows = jdbc.update(updateSQL,
                                        newStatus,
                                        schoolId,
                                        admissionNumber,
                                        feeHead);

                                if (updatedRows > 0) {
                                    log.info("✅ Updated Status to '{}' for {} in table {} (Original: {}, Paid: {}, Bal: {})",
                                            newStatus, feeHead, table, originalTotalAmount, totalPaidSoFar, realBalance);

                                    // Update remaining balance reference
                                    updateRemainingBalanceInDailyFeeCollection(jdbc, schoolId, admissionNumber,
                                            academicYear, feeHead, realBalance);
                                }
                            }
                        }

                    } catch (Exception e) {
                        // Fee head not found in this table, continue to next
                        log.debug("Fee head {} not found in table {}: {}", feeHead, table, e.getMessage());
                        continue;
                    }
                }
            }

        } catch (Exception e) {
            log.error("❌ Could not update fee table status for {}: {}", feePayment.getFeeHeading(), e.getMessage());
            log.error("Stack trace:", e);
        }
    }

    // Update remaining balance in daily_fee_collection for consistency
    private void updateRemainingBalanceInDailyFeeCollection(JdbcTemplate jdbc, String schoolId,
                                                            String admissionNumber, String academicYear,
                                                            String feeHead, Double newRemainingAmount) {
        try {
            // This is mainly for reporting purposes, to keep the remaining balance consistent
            String updateSql = """
                UPDATE daily_fee_collection 
                SET remaining_balance = ? 
                WHERE school_id = ? AND admission_number = ? AND academic_year = ? AND fee_head = ?
                ORDER BY created_at DESC LIMIT 1
            """;

            // Note: We need to add a remaining_balance column to daily_fee_collection table
            // For now, we'll log this but not execute if column doesn't exist
            log.info("📝 Would update remaining balance to {} for fee {} of student {}",
                    newRemainingAmount, feeHead, admissionNumber);

        } catch (Exception e) {
            log.debug("Could not update remaining balance in daily_fee_collection: {}", e.getMessage());
        }
    }

    // Get total paid and concession for a fee head
    private Double getTotalPaidConcessionForFeeHead(JdbcTemplate jdbc, String schoolId, String admissionNumber,
                                                    String academicYear, String feeHeading) {
        String sql = """
            SELECT COALESCE(SUM(paid_amount + concession_amount), 0) as total
            FROM daily_fee_collection 
            WHERE school_id = ? AND admission_number = ? AND academic_year = ? AND fee_head = ?
        """;
        try {
            Double total = jdbc.queryForObject(sql, Double.class, schoolId, admissionNumber, academicYear, feeHeading);
            return total != null ? total : 0.0;
        } catch (Exception e) {
            return 0.0;
        }
    }

    // Validate payment DTO
    private void validatePaymentDTO(DailyFeeCollectionDTO dto) {
        if (dto.getBillNumber() == null || dto.getBillNumber().trim().isEmpty()) {
            throw new RuntimeException("Bill number is required");
        }
        if (dto.getAdmissionNumber() == null || dto.getAdmissionNumber().trim().isEmpty()) {
            throw new RuntimeException("Admission number is required");
        }
        if (dto.getStudentName() == null || dto.getStudentName().trim().isEmpty()) {
            throw new RuntimeException("Student name is required");
        }
        if (dto.getPaymentMode() == null || dto.getPaymentMode().trim().isEmpty()) {
            throw new RuntimeException("Payment mode is required");
        }
        if (dto.getAcademicYear() == null || dto.getAcademicYear().trim().isEmpty()) {
            throw new RuntimeException("Academic year is required");
        }
        if (dto.getFeePayments() == null || dto.getFeePayments().isEmpty()) {
            throw new RuntimeException("At least one fee payment is required");
        }

        // Validate fee payments
        for (DailyFeeCollectionDTO.FeePaymentDetailDTO feePayment : dto.getFeePayments()) {
            if (feePayment.getFeeHeading() == null || feePayment.getFeeHeading().trim().isEmpty()) {
                throw new RuntimeException("Fee heading is required for all fee payments");
            }
            if (feePayment.getAccountHead() == null || feePayment.getAccountHead().trim().isEmpty()) {
                throw new RuntimeException("Account head is required for all fee payments");
            }
            if ((feePayment.getPaidAmount() == null || feePayment.getPaidAmount() <= 0) &&
                    (feePayment.getConcessionAmount() == null || feePayment.getConcessionAmount() <= 0)) {
                throw new RuntimeException("Either paid amount or concession amount must be greater than 0");
            }
        }
    }

    // Convert any object to Double safely
    private Double convertToDouble(Object value) {
        if (value == null) {
            return 0.0;
        }
        if (value instanceof String) {
            try {
                return Double.parseDouble(((String) value).trim());
            } catch (NumberFormatException e) {
                return 0.0;
            }
        } else if (value instanceof Number) {
            return ((Number) value).doubleValue();
        } else if (value instanceof Boolean) {
            return ((Boolean) value) ? 1.0 : 0.0;
        }
        return 0.0;
    }

    // Get payment history - ENHANCED to include transaction_narrative
    public List<Map<String, Object>> getPaymentHistory(String schoolId, String admissionNumber) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            // FIXED QUERY: Added payment_number to SELECT statement
            String sql = """
                SELECT 
                    bill_number as billNumber,
                    bill_date as billDate,
                    fee_head as description,
                    paid_amount as paidAmount,
                    concession_amount as concessionAmount,
                    net_paid_amount as netPaidAmount,
                    payment_mode as paymentMode,
                    payment_number as paymentNumber,  -- ADDED THIS LINE
                    operator_name as operatorName,
                    transaction_narrative as transactionNarrative,
                    academic_year as academicYear,
                    created_at as createdAt
                FROM daily_fee_collection 
                WHERE school_id = ? AND admission_number = ?
                ORDER BY bill_date DESC, id DESC
            """;

            List<Map<String, Object>> paymentHistory = jdbc.queryForList(sql, schoolId, admissionNumber);

            log.info("✅ Retrieved {} payment history records for admission number: {}",
                    paymentHistory.size(), admissionNumber);

            // Debug log to check if payment_number is included
            if (!paymentHistory.isEmpty()) {
                Map<String, Object> firstRecord = paymentHistory.get(0);
                log.debug("First record keys: {}", firstRecord.keySet());
                log.debug("Payment number in first record: {}", firstRecord.get("paymentNumber"));
            }

            return paymentHistory;
        } catch (Exception e) {
            log.error("❌ Error fetching payment history for admission number {}: {}", admissionNumber, e.getMessage());
            return new ArrayList<>();
        }
    }

    // Get last bill number with 5000 limit logic
    public Map<String, String> getLastBillNumber(String schoolId) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            String sql = """
                SELECT bill_number 
                FROM daily_fee_collection 
                WHERE school_id = ? 
                ORDER BY bill_date DESC, id DESC 
                LIMIT 1
            """;

            try {
                String lastBillNumber = jdbc.queryForObject(sql, String.class, schoolId);
                if (lastBillNumber != null && !lastBillNumber.trim().isEmpty()) {
                    // Extract the number part before "/"
                    String[] parts = lastBillNumber.split("/");
                    if (parts.length == 2) {
                        try {
                            int billNumber = Integer.parseInt(parts[0]);
                            // Check if bill number reached 5000
                            if (billNumber >= 5000) {
                                return Map.of("lastBillNumber", "5000/" + parts[1]);
                            }
                        } catch (NumberFormatException e) {
                            log.warn("⚠️ Invalid bill number format: {}", lastBillNumber);
                        }
                    }
                    return Map.of("lastBillNumber", lastBillNumber);
                }
            } catch (Exception e) {
                log.info("ℹ️ No previous bill numbers found for school: {}", schoolId);
            }

            // Generate default bill number for current financial year
            int currentYear = LocalDateTime.now().getYear();
            String financialYear = currentYear + "-" + String.valueOf(currentYear + 1).substring(2);
            return Map.of("lastBillNumber", "0000/" + financialYear);

        } catch (Exception e) {
            log.error("❌ Error fetching last bill number for school {}: {}", schoolId, e.getMessage());
            return Map.of("lastBillNumber", "");
        }
    }

    // Get all billing entries by school
    public List<DailyFeeCollection> getBillingEntriesBySchool(String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            String sql;
            Object[] params;

            if (academicYear != null && !academicYear.trim().isEmpty()) {
                sql = """
                    SELECT * FROM daily_fee_collection 
                    WHERE school_id = ? AND academic_year = ? 
                    ORDER BY bill_date DESC, id DESC
                """;
                params = new Object[]{schoolId, academicYear};
            } else {
                sql = "SELECT * FROM daily_fee_collection WHERE school_id = ? ORDER BY bill_date DESC, id DESC";
                params = new Object[]{schoolId};
            }

            List<DailyFeeCollection> billingEntries = jdbc.query(
                    sql,
                    new BeanPropertyRowMapper<>(DailyFeeCollection.class),
                    params
            );

            log.info("✅ Found {} billing entries for school: {}", billingEntries.size(), schoolId);
            return billingEntries;
        } catch (Exception e) {
            log.error("❌ Error fetching billing entries for school {}: {}", schoolId, e.getMessage());
            return new ArrayList<>();
        }
    }

    // Get billing entries by admission number
    public List<DailyFeeCollection> getBillingEntriesByAdmissionNumber(String schoolId, String admissionNumber, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            String sql;
            Object[] params;

            if (academicYear != null && !academicYear.trim().isEmpty()) {
                sql = """
                    SELECT * FROM daily_fee_collection 
                    WHERE school_id = ? AND admission_number = ? AND academic_year = ? 
                    ORDER BY bill_date DESC, id DESC
                """;
                params = new Object[]{schoolId, admissionNumber, academicYear};
            } else {
                sql = """
                    SELECT * FROM daily_fee_collection 
                    WHERE school_id = ? AND admission_number = ? 
                    ORDER BY bill_date DESC, id DESC
                """;
                params = new Object[]{schoolId, admissionNumber};
            }

            List<DailyFeeCollection> billingEntries = jdbc.query(
                    sql,
                    new BeanPropertyRowMapper<>(DailyFeeCollection.class),
                    params
            );

            log.info("✅ Found {} billing entries for admission number: {}", billingEntries.size(), admissionNumber);
            return billingEntries;
        } catch (Exception e) {
            log.error("❌ Error fetching billing entries for admission number {}: {}", admissionNumber, e.getMessage());
            return new ArrayList<>();
        }
    }

    // Get day book entries - UPDATED FOR NEW SCHEMA
    public List<DayBook> getDayBookEntries(String schoolId, LocalDateTime startDate, LocalDateTime endDate) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            StringBuilder sqlBuilder = new StringBuilder("""
                SELECT 
                    id,
                    br_number as brNumber,  -- Changed from bill_number
                    admission_number as admissionNumber,
                    name,
                    br_date as brDate,  -- Changed from bill_date
                    description,
                    ledger,  -- NEW COLUMN
                    credit,
                    debit,
                    mode,
                    operator_name as operatorName,
                    school_id as schoolId,
                    academic_year as academicYear,
                    created_at as createdAt
                FROM day_book 
                WHERE school_id = ?
            """);
            List<Object> params = new ArrayList<>();
            params.add(schoolId);

            if (startDate != null) {
                sqlBuilder.append(" AND br_date >= ?");
                params.add(java.sql.Timestamp.valueOf(startDate));
            }

            if (endDate != null) {
                sqlBuilder.append(" AND br_date <= ?");
                params.add(java.sql.Timestamp.valueOf(endDate));
            }

            sqlBuilder.append(" ORDER BY br_date DESC, id DESC");

            List<DayBook> dayBookEntries = jdbc.query(
                    sqlBuilder.toString(),
                    new BeanPropertyRowMapper<>(DayBook.class),
                    params.toArray()
            );

            log.info("✅ Found {} day book entries for school: {}", dayBookEntries.size(), schoolId);
            return dayBookEntries;
        } catch (Exception e) {
            log.error("❌ Error fetching day book entries: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    // Get total paid amount for a student
    public Double getTotalPaidAmount(String schoolId, String admissionNumber, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            String sql = """
                SELECT COALESCE(SUM(net_paid_amount), 0) 
                FROM daily_fee_collection 
                WHERE school_id = ? AND admission_number = ? AND academic_year = ?
            """;

            Double total = jdbc.queryForObject(sql, Double.class, schoolId, admissionNumber, academicYear);
            return total != null ? total : 0.0;
        } catch (Exception e) {
            log.error("❌ Error fetching total paid amount: {}", e.getMessage());
            return 0.0;
        }
    }

    // Enhanced method to get detailed payment history with grouping
    public List<Map<String, Object>> getPaymentHistoryDetailed(String schoolId, String admissionNumber) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            // First get all bills for this student grouped by bill number
            String sql = """
                SELECT 
                    bill_number,
                    MIN(bill_date) as bill_date,
                    COUNT(*) as item_count,
                    SUM(paid_amount) as total_paid,
                    SUM(concession_amount) as total_concession,
                    SUM(net_paid_amount) as total_net,
                    GROUP_CONCAT(fee_head SEPARATOR ', ') as fee_items,
                    payment_mode,
                    operator_name,
                    MAX(transaction_narrative) as transaction_narrative
                FROM daily_fee_collection 
                WHERE school_id = ? AND admission_number = ?
                GROUP BY bill_number, payment_mode, operator_name
                ORDER BY bill_date DESC
            """;

            List<Map<String, Object>> groupedHistory = jdbc.queryForList(sql, schoolId, admissionNumber);

            // Then get individual items for each bill
            for (Map<String, Object> bill : groupedHistory) {
                String billNumber = (String) bill.get("bill_number");

                String itemsSql = """
                    SELECT 
                        fee_head as description,
                        paid_amount,
                        concession_amount,
                        net_paid_amount,
                        transaction_narrative
                    FROM daily_fee_collection 
                    WHERE school_id = ? AND admission_number = ? AND bill_number = ?
                    ORDER BY id
                """;

                List<Map<String, Object>> items = jdbc.queryForList(itemsSql, schoolId, admissionNumber, billNumber);
                bill.put("items", items);
            }

            log.info("✅ Retrieved {} grouped payment history records for admission number: {}",
                    groupedHistory.size(), admissionNumber);
            return groupedHistory;
        } catch (Exception e) {
            log.error("❌ Error fetching detailed payment history for admission number {}: {}", admissionNumber, e.getMessage());
            return new ArrayList<>();
        }
    }
}