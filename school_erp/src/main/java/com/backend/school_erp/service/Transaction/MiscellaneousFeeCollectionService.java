package com.backend.school_erp.service.Transaction;

import com.backend.school_erp.DTO.Transaction.MiscellaneousFeeCollectionDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Transaction.MiscellaneousFeeCollection;
import com.backend.school_erp.entity.Transaction.MFCPaidAmount;
import com.backend.school_erp.entity.Transaction.MFCConcession;
import com.backend.school_erp.entity.Transaction.DayBookMFC;
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
public class MiscellaneousFeeCollectionService {

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
            // 1. Create miscellaneous_fee_collection table
            String createMiscellaneousFeeCollection = """
                CREATE TABLE IF NOT EXISTS miscellaneous_fee_collection (
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
                    INDEX idx_student_name (student_name),
                    INDEX idx_payment_number (payment_number)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """;

            // 2. Create mfc_paidamount table
            String createMFCPaidAmount = """
                CREATE TABLE IF NOT EXISTS mfc_paidamount (
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

            // 3. Create mfc_concession table
            String createMFCConcession = """
                CREATE TABLE IF NOT EXISTS mfc_concession (
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

            // 4. Create day_book_mfc table
            String createDayBookMFC = """
                CREATE TABLE IF NOT EXISTS day_book_mfc (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    br_number VARCHAR(100) NOT NULL,
                    admission_number VARCHAR(50) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    br_date TIMESTAMP NOT NULL,
                    description VARCHAR(500),
                    ledger VARCHAR(255),
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

            // 5. Check if individual_fees table exists, if not create it
            String createIndividualFees = """
                CREATE TABLE IF NOT EXISTS individual_fees (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    admission_number VARCHAR(50) NOT NULL,
                    student_name VARCHAR(255),
                    fee_head VARCHAR(255),
                    account_head VARCHAR(255),
                    amount DECIMAL(10,2),
                    school_id VARCHAR(50),
                    academic_year VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_admission_number (admission_number),
                    INDEX idx_school_academic (school_id, academic_year),
                    INDEX idx_fee_head (fee_head)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """;

            jdbc.execute(createMiscellaneousFeeCollection);
            jdbc.execute(createMFCPaidAmount);
            jdbc.execute(createMFCConcession);
            jdbc.execute(createDayBookMFC);
            jdbc.execute(createIndividualFees);

            log.info("✅ All 5 other fee billing tables created or already exist for school");
        } catch (Exception e) {
            log.error("❌ Failed to create other fee billing tables: {}", e.getMessage());
            throw new RuntimeException("Database table creation failed: " + e.getMessage(), e);
        }
    }

    // NEW METHOD: Get individual fees for a student with payment history calculation
    public List<Map<String, Object>> getIndividualFees(String schoolId, String admissionNumber, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            // First check if individual_fees table exists
            if (!tableExists(jdbc, "individual_fees")) {
                log.warn("⚠️ individual_fees table does not exist for school: {}", schoolId);
                return new ArrayList<>();
            }

            String sql = """
                SELECT 
                    id,
                    admission_number,
                    student_name,
                    fee_head,
                    account_head,
                    amount,
                    school_id,
                    academic_year,
                    created_at
                FROM individual_fees 
                WHERE school_id = ? AND admission_number = ? AND academic_year = ?
                ORDER BY fee_head
            """;

            List<Map<String, Object>> individualFees = jdbc.queryForList(sql, schoolId, admissionNumber, academicYear);

            // Calculate payment history for each individual fee
            for (Map<String, Object> fee : individualFees) {
                String feeHead = (String) fee.get("fee_head");
                Double originalAmount = convertToDouble(fee.get("amount"));

                // Get payment history for this specific fee
                String paymentSql = """
                    SELECT 
                        COALESCE(SUM(paid_amount), 0) as total_paid,
                        COALESCE(SUM(concession_amount), 0) as total_concession
                    FROM miscellaneous_fee_collection 
                    WHERE school_id = ? AND admission_number = ? AND academic_year = ? 
                    AND fee_head = ?
                """;

                try {
                    Map<String, Object> paymentData = jdbc.queryForMap(
                            paymentSql,
                            schoolId,
                            admissionNumber,
                            academicYear,
                            feeHead
                    );

                    Double totalPaid = convertToDouble(paymentData.get("total_paid"));
                    Double totalConcession = convertToDouble(paymentData.get("total_concession"));
                    Double remainingBalance = originalAmount - totalPaid - totalConcession;

                    // Add payment history fields
                    fee.put("paid_amount", totalPaid);
                    fee.put("concession_amount", totalConcession);
                    fee.put("remaining_balance", Math.max(0, remainingBalance));
                    fee.put("is_fully_paid", remainingBalance <= 0.01);

                } catch (Exception e) {
                    // No payment history found
                    fee.put("paid_amount", 0.0);
                    fee.put("concession_amount", 0.0);
                    fee.put("remaining_balance", originalAmount);
                    fee.put("is_fully_paid", false);
                }
            }

            log.info("✅ Retrieved {} individual fees for admission number: {}", individualFees.size(), admissionNumber);
            return individualFees;

        } catch (Exception e) {
            log.error("❌ Error fetching individual fees for admission number {}: {}", admissionNumber, e.getMessage());
            return new ArrayList<>();
        }
    }

    // Get student fee details with proper payment history calculation - UPDATED to include individual fees
    public Map<String, Object> getStudentFeeDetails(String schoolId, String admissionNumber, String academicYear) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> feeDetails = new ArrayList<>();

        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            // Get student info
            Map<String, Object> studentInfo = getStudentInfo(jdbc, schoolId, admissionNumber, academicYear);

            // Get other fee setup for the academic year
            String feeSetupTable = "miscellaneous_fee_setup_" + academicYear.replaceAll("[^a-zA-Z0-9]", "_");

            if (tableExists(jdbc, feeSetupTable)) {
                String sql = String.format("""
                    SELECT 
                        fee_head as heading,
                        account_head as accountHead,
                        default_amount as originalAmount,
                        status,
                        'Miscellaneous' as feeType,
                        'Miscellaneous' as type
                    FROM %s 
                    WHERE school_id = ? AND academic_year = ?
                    AND (status IS NULL OR status != 'inactive')
                """, feeSetupTable);

                List<Map<String, Object>> fees = jdbc.queryForList(sql, schoolId, academicYear);

                for (Map<String, Object> fee : fees) {
                    fee.put("originalAmount", convertToDouble(fee.get("originalAmount")));
                    fee.put("remainingBalance", convertToDouble(fee.get("originalAmount")));
                    fee.put("previousPaid", 0.0);
                    fee.put("previousConcession", 0.0);
                    fee.put("aadharNo", studentInfo.getOrDefault("aadharNo", ""));
                    fee.put("emisNo", studentInfo.getOrDefault("emisNo", ""));
                    feeDetails.add(fee);
                }
            }

            // Get individual fees for the student
            List<Map<String, Object>> individualFees = getIndividualFees(schoolId, admissionNumber, academicYear);
            for (Map<String, Object> fee : individualFees) {
                Double originalAmount = convertToDouble(fee.get("amount"));
                Double paidAmount = convertToDouble(fee.get("paid_amount"));
                Double concessionAmount = convertToDouble(fee.get("concession_amount"));
                Double remainingBalance = convertToDouble(fee.get("remaining_balance"));

                // Only add if not fully paid
                if (remainingBalance > 0.01) {
                    Map<String, Object> individualFee = new HashMap<>();
                    individualFee.put("heading", fee.get("fee_head"));
                    individualFee.put("accountHead", fee.get("account_head"));
                    individualFee.put("originalAmount", originalAmount);
                    individualFee.put("remainingBalance", remainingBalance);
                    individualFee.put("previousPaid", paidAmount);
                    individualFee.put("previousConcession", concessionAmount);
                    individualFee.put("feeType", "Individual");
                    individualFee.put("type", "Individual");
                    individualFee.put("aadharNo", studentInfo.getOrDefault("aadharNo", ""));
                    individualFee.put("emisNo", studentInfo.getOrDefault("emisNo", ""));
                    individualFee.put("isFullyPaid", false);
                    feeDetails.add(individualFee);
                }
            }

            // Adjust balances with payment history for miscellaneous fees
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

            log.info("✅ Found {} other fee details for admission {} with total: {}, remaining: {}",
                    feeDetails.size(), admissionNumber, totalFees, totalRemainingBalance);

        } catch (Exception e) {
            log.error("❌ Error fetching student other fee details for admission {}: {}", admissionNumber, e.getMessage());
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
                        continue;
                    }
                }
            }

            studentInfo.putIfAbsent("aadhar_no", "");
            studentInfo.putIfAbsent("emis_no", "");
            studentInfo.putIfAbsent("student_name", "");
            studentInfo.putIfAbsent("father_name", "");
            studentInfo.putIfAbsent("standard", "");
            studentInfo.putIfAbsent("section", "");
            studentInfo.putIfAbsent("boarding_point", "");

        } catch (Exception e) {
            log.warn("⚠️ Student info not found for {}: {}", admissionNumber, e.getMessage());
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
            String paidSql = """
                SELECT 
                    fee_head, 
                    SUM(COALESCE(paid_amount, 0)) as total_paid,
                    SUM(COALESCE(concession_amount, 0)) as total_concession
                FROM miscellaneous_fee_collection 
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
                    remainingBalance = 0.0;
                }

                fee.put("previousPaid", totalPaid);
                fee.put("previousConcession", totalConcession);
                fee.put("remainingBalance", remainingBalance);
                fee.put("status", remainingBalance <= 0.01 ? "Settled" : "Pending");
                fee.put("isFullyPaid", remainingBalance <= 0.01);
            }

            log.info("✅ Adjusted balances for {} other fee heads", feeDetails.size());
            return feeDetails;

        } catch (Exception e) {
            log.error("❌ Error adjusting balances with payment history: {}", e.getMessage());
            return feeDetails;
        }
    }

    // Main payment processing method
    @Transactional(rollbackFor = Exception.class)
    public MiscellaneousFeeCollection processPayment(String schoolId, MiscellaneousFeeCollectionDTO dto) {
        JdbcTemplate jdbc = null;
        MiscellaneousFeeCollection result = null;

        try {
            jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            validatePaymentDTO(dto);

            Map<String, Object> studentInfo = getStudentInfo(jdbc, schoolId, dto.getAdmissionNumber(), dto.getAcademicYear());

            LocalDateTime billDate = dto.getBillDate() != null ? dto.getBillDate() : LocalDateTime.now();
            LocalDateTime transactionDate = dto.getTransactionDate() != null ? dto.getTransactionDate() : billDate;

            for (MiscellaneousFeeCollectionDTO.FeePaymentDetailDTO feePayment : dto.getFeePayments()) {
                try {
                    Double paidAmount = feePayment.getPaidAmount() != null ? feePayment.getPaidAmount() : 0.0;
                    Double concessionAmount = feePayment.getConcessionAmount() != null ? feePayment.getConcessionAmount() : 0.0;
                    Double netPaidAmount = paidAmount + concessionAmount;

                    String insertMiscellaneousFeeSQL = """
                        INSERT INTO miscellaneous_fee_collection (
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
                            transaction_date = VALUES(transaction_date),
                            payment_number = VALUES(payment_number)
                    """;

                    jdbc.update(insertMiscellaneousFeeSQL,
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

                    // Insert paid amounts into mfc_paidamount (if any paid amount)
                    if (paidAmount > 0) {
                        String insertPaidSQL = """
                            INSERT INTO mfc_paidamount (
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

                    // Insert concessions into mfc_concession (if any concession)
                    if (concessionAmount > 0) {
                        String insertConcessionSQL = """
                            INSERT INTO mfc_concession (
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

                    // Insert into day_book_mfc
                    String insertDayBookSQL = """
                        INSERT INTO day_book_mfc (
                            br_number, admission_number, name, br_date, description, 
                            ledger, credit, debit, mode, operator_name, school_id, academic_year
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """;

                    String descriptionWithClass = dto.getStandard() + "-" + dto.getSection();

                    jdbc.update(insertDayBookSQL,
                            dto.getBillNumber(),
                            dto.getAdmissionNumber(),
                            dto.getStudentName(),
                            java.sql.Timestamp.valueOf(billDate),
                            descriptionWithClass,
                            feePayment.getFeeHeading(),
                            paidAmount,
                            concessionAmount,
                            dto.getPaymentMode(),
                            dto.getOperatorName(),
                            schoolId,
                            dto.getAcademicYear()
                    );

                } catch (Exception feeError) {
                    log.error("❌ Error processing fee payment {}: {}", feePayment.getFeeHeading(), feeError.getMessage());
                    throw new RuntimeException("Failed to process fee payment for " + feePayment.getFeeHeading() + ": " + feeError.getMessage(), feeError);
                }
            }

            String selectSQL = """
                SELECT * FROM miscellaneous_fee_collection 
                WHERE bill_number = ? AND school_id = ? 
                ORDER BY created_at DESC LIMIT 1
            """;

            result = jdbc.queryForObject(selectSQL,
                    new BeanPropertyRowMapper<>(MiscellaneousFeeCollection.class),
                    dto.getBillNumber(), schoolId
            );

            log.info("✅ Successfully processed other fee payment. Bill: {}, Student: {}, Amount: {}, Payment Number: {}",
                    dto.getBillNumber(), dto.getAdmissionNumber(), dto.getNetPaidAmount(), dto.getPaymentNumber());

            return result;

        } catch (Exception e) {
            log.error("❌ Error processing other fee payment for bill {}: {}",
                    dto != null ? dto.getBillNumber() : "unknown", e.getMessage());
            log.error("Stack trace:", e);
            throw new RuntimeException("Failed to process payment: " + e.getMessage(), e);
        }
    }

    // Validate payment DTO
    private void validatePaymentDTO(MiscellaneousFeeCollectionDTO dto) {
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

        for (MiscellaneousFeeCollectionDTO.FeePaymentDetailDTO feePayment : dto.getFeePayments()) {
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

    // Get payment history - UPDATED to include payment_number
    public List<Map<String, Object>> getPaymentHistory(String schoolId, String admissionNumber) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            String sql = """
                SELECT 
                    bill_number as billNumber,
                    bill_date as billDate,
                    fee_head as description,
                    paid_amount as paidAmount,
                    concession_amount as concessionAmount,
                    net_paid_amount as netPaidAmount,
                    payment_mode as paymentMode,
                    payment_number as paymentNumber,  -- NEW: Include payment number
                    operator_name as operatorName,
                    transaction_narrative as transactionNarrative,
                    academic_year as academicYear,
                    created_at as createdAt
                FROM miscellaneous_fee_collection 
                WHERE school_id = ? AND admission_number = ?
                ORDER BY bill_date DESC, id DESC
            """;

            List<Map<String, Object>> paymentHistory = jdbc.queryForList(sql, schoolId, admissionNumber);

            log.info("✅ Retrieved {} other fee payment history records for admission number: {}",
                    paymentHistory.size(), admissionNumber);
            return paymentHistory;
        } catch (Exception e) {
            log.error("❌ Error fetching other fee payment history for admission number {}: {}", admissionNumber, e.getMessage());
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
                FROM miscellaneous_fee_collection 
                WHERE school_id = ? 
                ORDER BY bill_date DESC, id DESC 
                LIMIT 1
            """;

            try {
                String lastBillNumber = jdbc.queryForObject(sql, String.class, schoolId);
                if (lastBillNumber != null && !lastBillNumber.trim().isEmpty()) {
                    String[] parts = lastBillNumber.split("/");
                    if (parts.length == 2) {
                        try {
                            int billNumber = Integer.parseInt(parts[0]);
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
                log.info("ℹ️ No previous other fee bill numbers found for school: {}", schoolId);
            }

            int currentYear = LocalDateTime.now().getYear();
            String financialYear = currentYear + "-" + String.valueOf(currentYear + 1).substring(2);
            return Map.of("lastBillNumber", "0000/" + financialYear);

        } catch (Exception e) {
            log.error("❌ Error fetching last other fee bill number for school {}: {}", schoolId, e.getMessage());
            return Map.of("lastBillNumber", "");
        }
    }

    // Get all billing entries by school
    public List<MiscellaneousFeeCollection> getBillingEntriesBySchool(String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            String sql;
            Object[] params;

            if (academicYear != null && !academicYear.trim().isEmpty()) {
                sql = """
                    SELECT * FROM miscellaneous_fee_collection 
                    WHERE school_id = ? AND academic_year = ? 
                    ORDER BY bill_date DESC, id DESC
                """;
                params = new Object[]{schoolId, academicYear};
            } else {
                sql = "SELECT * FROM miscellaneous_fee_collection WHERE school_id = ? ORDER BY bill_date DESC, id DESC";
                params = new Object[]{schoolId};
            }

            List<MiscellaneousFeeCollection> billingEntries = jdbc.query(
                    sql,
                    new BeanPropertyRowMapper<>(MiscellaneousFeeCollection.class),
                    params
            );

            log.info("✅ Found {} other fee billing entries for school: {}", billingEntries.size(), schoolId);
            return billingEntries;
        } catch (Exception e) {
            log.error("❌ Error fetching other fee billing entries for school {}: {}", schoolId, e.getMessage());
            return new ArrayList<>();
        }
    }

    // Get billing entries by admission number
    public List<MiscellaneousFeeCollection> getBillingEntriesByAdmissionNumber(String schoolId, String admissionNumber, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            String sql;
            Object[] params;

            if (academicYear != null && !academicYear.trim().isEmpty()) {
                sql = """
                    SELECT * FROM miscellaneous_fee_collection 
                    WHERE school_id = ? AND admission_number = ? AND academic_year = ? 
                    ORDER BY bill_date DESC, id DESC
                """;
                params = new Object[]{schoolId, admissionNumber, academicYear};
            } else {
                sql = """
                    SELECT * FROM miscellaneous_fee_collection 
                    WHERE school_id = ? AND admission_number = ? 
                    ORDER BY bill_date DESC, id DESC
                """;
                params = new Object[]{schoolId, admissionNumber};
            }

            List<MiscellaneousFeeCollection> billingEntries = jdbc.query(
                    sql,
                    new BeanPropertyRowMapper<>(MiscellaneousFeeCollection.class),
                    params
            );

            log.info("✅ Found {} other fee billing entries for admission number: {}", billingEntries.size(), admissionNumber);
            return billingEntries;
        } catch (Exception e) {
            log.error("❌ Error fetching other fee billing entries for admission number {}: {}", admissionNumber, e.getMessage());
            return new ArrayList<>();
        }
    }

    // Get day book entries
    public List<DayBookMFC> getDayBookEntries(String schoolId, LocalDateTime startDate, LocalDateTime endDate) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            StringBuilder sqlBuilder = new StringBuilder("""
                SELECT 
                    id,
                    br_number as brNumber,
                    admission_number as admissionNumber,
                    name,
                    br_date as brDate,
                    description,
                    ledger,
                    credit,
                    debit,
                    mode,
                    operator_name as operatorName,
                    school_id as schoolId,
                    academic_year as academicYear,
                    created_at as createdAt
                FROM day_book_mfc 
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

            List<DayBookMFC> dayBookEntries = jdbc.query(
                    sqlBuilder.toString(),
                    new BeanPropertyRowMapper<>(DayBookMFC.class),
                    params.toArray()
            );

            log.info("✅ Found {} other fee day book entries for school: {}", dayBookEntries.size(), schoolId);
            return dayBookEntries;
        } catch (Exception e) {
            log.error("❌ Error fetching other fee day book entries: {}", e.getMessage());
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
                FROM miscellaneous_fee_collection 
                WHERE school_id = ? AND admission_number = ? AND academic_year = ?
            """;

            Double total = jdbc.queryForObject(sql, Double.class, schoolId, admissionNumber, academicYear);
            return total != null ? total : 0.0;
        } catch (Exception e) {
            log.error("❌ Error fetching total other fee paid amount: {}", e.getMessage());
            return 0.0;
        }
    }

    // Enhanced method to get detailed payment history with grouping and payment number
    public List<Map<String, Object>> getPaymentHistoryDetailed(String schoolId, String admissionNumber) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

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
                    payment_number,  -- NEW: Include payment number
                    operator_name,
                    MAX(transaction_narrative) as transaction_narrative
                FROM miscellaneous_fee_collection 
                WHERE school_id = ? AND admission_number = ?
                GROUP BY bill_number, payment_mode, payment_number, operator_name
                ORDER BY bill_date DESC
            """;

            List<Map<String, Object>> groupedHistory = jdbc.queryForList(sql, schoolId, admissionNumber);

            for (Map<String, Object> bill : groupedHistory) {
                String billNumber = (String) bill.get("bill_number");

                String itemsSql = """
                    SELECT 
                        fee_head as description,
                        paid_amount,
                        concession_amount,
                        net_paid_amount,
                        transaction_narrative
                    FROM miscellaneous_fee_collection 
                    WHERE school_id = ? AND admission_number = ? AND bill_number = ?
                    ORDER BY id
                """;

                List<Map<String, Object>> items = jdbc.queryForList(itemsSql, schoolId, admissionNumber, billNumber);
                bill.put("items", items);
            }

            log.info("✅ Retrieved {} grouped other fee payment history records for admission number: {}",
                    groupedHistory.size(), admissionNumber);
            return groupedHistory;
        } catch (Exception e) {
            log.error("❌ Error fetching detailed other fee payment history for admission number {}: {}", admissionNumber, e.getMessage());
            return new ArrayList<>();
        }
    }

    // Get fee heads from database for dropdown
    public List<Map<String, Object>> getFeeHeads(String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            String feeSetupTable = "miscellaneous_fee_setup_" + academicYear.replaceAll("[^a-zA-Z0-9]", "_");

            if (tableExists(jdbc, feeSetupTable)) {
                String sql = String.format("""
                    SELECT 
                        id,
                        fee_head as feeHead,
                        account_head as accountHead,
                        default_amount as defaultAmount,
                        description,
                        status
                    FROM %s 
                    WHERE school_id = ? AND academic_year = ?
                    AND (status IS NULL OR status != 'inactive')
                    ORDER BY fee_head
                """, feeSetupTable);

                List<Map<String, Object>> feeHeads = jdbc.queryForList(sql, schoolId, academicYear);

                log.info("✅ Retrieved {} fee heads for school: {}, academic year: {}",
                        feeHeads.size(), schoolId, academicYear);
                return feeHeads;
            } else {
                log.warn("⚠️ Fee setup table {} does not exist for school: {}", feeSetupTable, schoolId);
                return new ArrayList<>();
            }
        } catch (Exception e) {
            log.error("❌ Error fetching fee heads for school {}: {}", schoolId, e.getMessage());
            return new ArrayList<>();
        }
    }
}