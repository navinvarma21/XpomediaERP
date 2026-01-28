package com.backend.school_erp.service.Collection;

import com.backend.school_erp.config.DatabaseConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class TutionReportService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating HikariCP DataSource for tuition reports - school: {}", id);
            HikariConfig config = new HikariConfig();



            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");

            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);
            config.setMaxLifetime(1800000);
            config.setConnectionTimeout(10000);

            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private void ensureTablesExist(JdbcTemplate jdbc) {
        try {
            // Check if Daily Fee Collection tables exist (they should from the DailyFeeCollectionService)
            String[] checkTables = {
                    "daily_fee_collection",
                    "dfcpaidamount",
                    "dfcconcession",
                    "day_book"
            };

            for (String table : checkTables) {
                try {
                    jdbc.execute("SELECT 1 FROM " + table + " LIMIT 0");
                    log.debug("✅ Table {} exists", table);
                } catch (Exception e) {
                    log.warn("⚠️ Table {} does not exist or is inaccessible: {}", table, e.getMessage());
                    // The tables should be created by DailyFeeCollectionService
                    // We'll create a fallback view if needed
                }
            }
        } catch (Exception e) {
            log.error("❌ Error checking tables: {}", e.getMessage());
        }
    }

    // Get day collection report from daily_fee_collection table
    public Map<String, Object> getDayCollectionReport(String date, String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            // Parse date and set time range for the entire day
            LocalDate reportDate = LocalDate.parse(date);
            LocalDateTime startDateTime = reportDate.atStartOfDay();
            LocalDateTime endDateTime = reportDate.atTime(23, 59, 59);

            log.info("📅 Generating day collection report for date: {}, school: {}, academic year: {}",
                    date, schoolId, academicYear);

            // Query from daily_fee_collection table (main transaction table)
            String sql = """
                SELECT 
                    dfc.bill_number,
                    dfc.admission_number,
                    dfc.student_name,
                    dfc.father_name,
                    dfc.standard,
                    dfc.section,
                    dfc.boarding_point,
                    dfc.bill_date,
                    dfc.fee_head,
                    dfc.account_head,
                    dfc.paid_amount,
                    dfc.concession_amount,
                    dfc.net_paid_amount,
                    dfc.payment_mode,
                    dfc.payment_number,
                    dfc.operator_name,
                    dfc.transaction_narrative,
                    dfc.transaction_date,
                    dfc.academic_year,
                    db.credit as day_book_credit,
                    db.debit as day_book_debit
                FROM daily_fee_collection dfc
                LEFT JOIN day_book db ON dfc.bill_number = db.br_number 
                    AND dfc.admission_number = db.admission_number
                    AND dfc.fee_head = db.ledger
                WHERE dfc.school_id = ? 
                AND dfc.academic_year = ?
                AND DATE(dfc.bill_date) = ?
                ORDER BY dfc.admission_number, dfc.bill_date, dfc.fee_head
            """;

            List<Map<String, Object>> results = jdbc.queryForList(
                    sql, schoolId, academicYear, reportDate
            );

            List<Map<String, Object>> collections = new ArrayList<>();
            double totalPaidAmount = 0.0;
            double totalConcessionAmount = 0.0;

            // Process each fee head entry
            for (Map<String, Object> row : results) {
                Map<String, Object> collection = new HashMap<>();

                // Basic student info
                collection.put("billNumber", row.get("bill_number"));
                collection.put("admissionNumber", row.get("admission_number"));
                collection.put("studentName", row.get("student_name"));
                collection.put("fatherName", row.get("father_name"));
                collection.put("standard", row.get("standard"));
                collection.put("section", row.get("section"));
                collection.put("boardingPoint", row.get("boarding_point"));
                collection.put("feeHead", row.get("fee_head"));
                collection.put("accountHead", row.get("account_head"));

                // Payment info
                collection.put("paymentMode", row.get("payment_mode"));
                collection.put("paymentNumber", row.get("payment_number"));
                collection.put("operatorName", row.get("operator_name"));
                collection.put("transactionNarrative", row.get("transaction_narrative"));
                collection.put("academicYear", row.get("academic_year"));

                // Amounts
                Double paidAmount = convertToDouble(row.get("paid_amount"));
                Double concessionAmount = convertToDouble(row.get("concession_amount"));
                Double netPaidAmount = convertToDouble(row.get("net_paid_amount"));

                collection.put("paidAmount", paidAmount);
                collection.put("concessionAmount", concessionAmount);
                collection.put("netPaidAmount", netPaidAmount);
                collection.put("totalPaidAmount", paidAmount); // For backward compatibility
                collection.put("totalConcessionAmount", concessionAmount); // For backward compatibility

                // Timestamps
                collection.put("billDate", convertTimestamp(row.get("bill_date")));
                collection.put("transactionDate", convertTimestamp(row.get("transaction_date")));
                collection.put("timestamp", convertTimestamp(row.get("bill_date"))); // For frontend compatibility

                // Create fee details array
                List<Map<String, Object>> feeDetails = new ArrayList<>();
                Map<String, Object> feeDetail = new HashMap<>();
                feeDetail.put("feeHead", row.get("fee_head"));
                feeDetail.put("accountHead", row.get("account_head"));
                feeDetail.put("paidAmount", paidAmount);
                feeDetail.put("concessionAmount", concessionAmount);
                feeDetail.put("netPaidAmount", netPaidAmount);
                feeDetails.add(feeDetail);

                collection.put("feeDetails", feeDetails);
                collection.put("description", row.get("fee_head")); // Use fee head as description

                // Add to collections
                collections.add(collection);

                // Update totals
                totalPaidAmount += paidAmount;
                totalConcessionAmount += concessionAmount;
            }

            // If we have no results from daily_fee_collection, try day_book table as fallback
            if (collections.isEmpty()) {
                log.info("No data in daily_fee_collection, trying day_book table...");
                collections = getDayBookReport(schoolId, academicYear, reportDate);

                // Calculate totals from day_book
                for (Map<String, Object> collection : collections) {
                    totalPaidAmount += convertToDouble(collection.get("paidAmount"));
                    totalConcessionAmount += convertToDouble(collection.get("concessionAmount"));
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("collections", collections);
            response.put("totalCollection", totalPaidAmount); // Total cash collected
            response.put("totalConcession", totalConcessionAmount); // Total concession given
            response.put("reportDate", date);
            response.put("academicYear", academicYear);
            response.put("recordCount", collections.size());

            log.info("✅ Day collection report generated - School: {}, Date: {}, Records: {}, Total: ₹{}, Concession: ₹{}",
                    schoolId, date, collections.size(), totalPaidAmount, totalConcessionAmount);

            return response;

        } catch (Exception e) {
            log.error("❌ Error generating day collection report for school {} on date {}: {}",
                    schoolId, date, e.getMessage(), e);

            // Return empty response instead of throwing
            Map<String, Object> emptyResponse = new HashMap<>();
            emptyResponse.put("collections", new ArrayList<>());
            emptyResponse.put("totalCollection", 0.0);
            emptyResponse.put("totalConcession", 0.0);
            emptyResponse.put("reportDate", date);
            emptyResponse.put("academicYear", academicYear);
            emptyResponse.put("recordCount", 0);
            emptyResponse.put("error", "No data available for selected date");

            return emptyResponse;
        }
    }

    // Fallback method: Get data from day_book table
    private List<Map<String, Object>> getDayBookReport(String schoolId, String academicYear, LocalDate reportDate) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            String sql = """
                SELECT 
                    br_number as bill_number,
                    admission_number,
                    name as student_name,
                    br_date,
                    description,
                    ledger as fee_head,
                    credit as paid_amount,
                    debit as concession_amount,
                    mode as payment_mode,
                    operator_name,
                    academic_year
                FROM day_book 
                WHERE school_id = ? 
                AND academic_year = ?
                AND DATE(br_date) = ?
                ORDER BY admission_number, br_date
            """;

            List<Map<String, Object>> results = jdbc.queryForList(
                    sql, schoolId, academicYear, reportDate
            );

            List<Map<String, Object>> collections = new ArrayList<>();

            for (Map<String, Object> row : results) {
                Map<String, Object> collection = new HashMap<>();

                // Parse admission number from description if needed
                String description = (String) row.get("description");
                String admissionNumber = (String) row.get("admission_number");

                // Try to extract standard and section from description
                String standard = "";
                String section = "";
                if (description != null && description.contains("-")) {
                    String[] parts = description.split("-");
                    if (parts.length >= 2) {
                        standard = parts[0].trim();
                        section = parts[1].trim();
                    }
                }

                collection.put("billNumber", row.get("bill_number"));
                collection.put("admissionNumber", admissionNumber);
                collection.put("studentName", row.get("student_name"));
                collection.put("standard", standard);
                collection.put("section", section);
                collection.put("feeHead", row.get("fee_head"));
                collection.put("paidAmount", convertToDouble(row.get("paid_amount")));
                collection.put("concessionAmount", convertToDouble(row.get("concession_amount")));
                collection.put("paymentMode", row.get("payment_mode"));
                collection.put("operatorName", row.get("operator_name"));
                collection.put("timestamp", convertTimestamp(row.get("br_date")));
                collection.put("description", row.get("fee_head"));

                // Create fee details
                List<Map<String, Object>> feeDetails = new ArrayList<>();
                Map<String, Object> feeDetail = new HashMap<>();
                feeDetail.put("feeHead", row.get("fee_head"));
                feeDetail.put("paidAmount", convertToDouble(row.get("paid_amount")));
                feeDetail.put("concessionAmount", convertToDouble(row.get("concession_amount")));
                feeDetails.add(feeDetail);

                collection.put("feeDetails", feeDetails);
                collection.put("totalPaidAmount", convertToDouble(row.get("paid_amount")));
                collection.put("totalConcessionAmount", convertToDouble(row.get("concession_amount")));

                collections.add(collection);
            }

            log.info("📊 Retrieved {} records from day_book table", collections.size());
            return collections;

        } catch (Exception e) {
            log.error("Error retrieving from day_book: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    // Get periodical collection report
    public Map<String, Object> getPeriodicalCollectionReport(String startDate, String endDate,
                                                             String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            // Parse dates and set time range
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            log.info("📅 Generating periodical collection report - Period: {} to {}, School: {}, Academic Year: {}",
                    startDate, endDate, schoolId, academicYear);

            // Query from daily_fee_collection table
            String sql = """
                SELECT 
                    dfc.bill_number,
                    dfc.admission_number,
                    dfc.student_name,
                    dfc.father_name,
                    dfc.standard,
                    dfc.section,
                    dfc.boarding_point,
                    dfc.bill_date,
                    dfc.fee_head,
                    dfc.account_head,
                    dfc.paid_amount,
                    dfc.concession_amount,
                    dfc.net_paid_amount,
                    dfc.payment_mode,
                    dfc.payment_number,
                    dfc.operator_name,
                    dfc.transaction_narrative,
                    dfc.transaction_date,
                    dfc.academic_year,
                    DATE(dfc.bill_date) as collection_date
                FROM daily_fee_collection dfc
                WHERE dfc.school_id = ? 
                AND dfc.academic_year = ?
                AND DATE(dfc.bill_date) BETWEEN ? AND ?
                ORDER BY DATE(dfc.bill_date), dfc.admission_number, dfc.bill_date
            """;

            List<Map<String, Object>> results = jdbc.queryForList(
                    sql, schoolId, academicYear, start, end
            );

            List<Map<String, Object>> collections = new ArrayList<>();
            double totalPaidAmount = 0.0;
            double totalConcessionAmount = 0.0;

            // Group by date for better organization
            Map<String, List<Map<String, Object>>> dateGroups = new LinkedHashMap<>();

            for (Map<String, Object> row : results) {
                String collectionDate = ((java.sql.Date) row.get("collection_date")).toString();

                Map<String, Object> collection = new HashMap<>();

                // Basic student info
                collection.put("billNumber", row.get("bill_number"));
                collection.put("admissionNumber", row.get("admission_number"));
                collection.put("studentName", row.get("student_name"));
                collection.put("fatherName", row.get("father_name"));
                collection.put("standard", row.get("standard"));
                collection.put("section", row.get("section"));
                collection.put("boardingPoint", row.get("boarding_point"));
                collection.put("feeHead", row.get("fee_head"));
                collection.put("accountHead", row.get("account_head"));
                collection.put("collectionDate", collectionDate);

                // Payment info
                collection.put("paymentMode", row.get("payment_mode"));
                collection.put("paymentNumber", row.get("payment_number"));
                collection.put("operatorName", row.get("operator_name"));
                collection.put("transactionNarrative", row.get("transaction_narrative"));
                collection.put("academicYear", row.get("academic_year"));

                // Amounts
                Double paidAmount = convertToDouble(row.get("paid_amount"));
                Double concessionAmount = convertToDouble(row.get("concession_amount"));
                Double netPaidAmount = convertToDouble(row.get("net_paid_amount"));

                collection.put("paidAmount", paidAmount);
                collection.put("concessionAmount", concessionAmount);
                collection.put("netPaidAmount", netPaidAmount);
                collection.put("totalPaidAmount", paidAmount);
                collection.put("totalConcessionAmount", concessionAmount);

                // Timestamps
                collection.put("billDate", convertTimestamp(row.get("bill_date")));
                collection.put("transactionDate", convertTimestamp(row.get("transaction_date")));
                collection.put("timestamp", convertTimestamp(row.get("bill_date")));

                // Create fee details
                List<Map<String, Object>> feeDetails = new ArrayList<>();
                Map<String, Object> feeDetail = new HashMap<>();
                feeDetail.put("feeHead", row.get("fee_head"));
                feeDetail.put("accountHead", row.get("account_head"));
                feeDetail.put("paidAmount", paidAmount);
                feeDetail.put("concessionAmount", concessionAmount);
                feeDetail.put("netPaidAmount", netPaidAmount);
                feeDetails.add(feeDetail);

                collection.put("feeDetails", feeDetails);
                collection.put("description", row.get("fee_head"));

                // Add to date group
                dateGroups.computeIfAbsent(collectionDate, k -> new ArrayList<>()).add(collection);

                // Update totals
                totalPaidAmount += paidAmount;
                totalConcessionAmount += concessionAmount;
            }

            // Flatten the date groups into a single list with date headers
            List<Map<String, Object>> organizedCollections = new ArrayList<>();

            for (Map.Entry<String, List<Map<String, Object>>> entry : dateGroups.entrySet()) {
                // Add date header
                Map<String, Object> dateHeader = new HashMap<>();
                dateHeader.put("type", "date");
                dateHeader.put("date", entry.getKey());
                organizedCollections.add(dateHeader);

                // Add all collections for this date
                organizedCollections.addAll(entry.getValue());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("collections", organizedCollections);
            response.put("totalCollection", totalPaidAmount);
            response.put("totalConcession", totalConcessionAmount);
            response.put("startDate", startDate);
            response.put("endDate", endDate);
            response.put("academicYear", academicYear);
            response.put("recordCount", results.size());

            log.info("✅ Periodical collection report generated - School: {}, Period: {} to {}, Records: {}, Total: ₹{}, Concession: ₹{}",
                    schoolId, startDate, endDate, results.size(), totalPaidAmount, totalConcessionAmount);

            return response;

        } catch (Exception e) {
            log.error("❌ Error generating periodical collection report for school {} from {} to {}: {}",
                    schoolId, startDate, endDate, e.getMessage(), e);

            // Return empty response
            Map<String, Object> emptyResponse = new HashMap<>();
            emptyResponse.put("collections", new ArrayList<>());
            emptyResponse.put("totalCollection", 0.0);
            emptyResponse.put("totalConcession", 0.0);
            emptyResponse.put("startDate", startDate);
            emptyResponse.put("endDate", endDate);
            emptyResponse.put("academicYear", academicYear);
            emptyResponse.put("recordCount", 0);
            emptyResponse.put("error", "No data available for selected period");

            return emptyResponse;
        }
    }

    // Get collection summary (last 30 days)
    public Map<String, Object> getCollectionSummary(String schoolId, String academicYear, String period) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            int days = Integer.parseInt(period);
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(days - 1);

            String sql = """
                SELECT 
                    DATE(bill_date) as collection_date,
                    COUNT(DISTINCT bill_number) as transaction_count,
                    COUNT(*) as fee_item_count,
                    SUM(paid_amount) as daily_paid_total,
                    SUM(concession_amount) as daily_concession_total,
                    SUM(net_paid_amount) as daily_net_total,
                    COUNT(DISTINCT admission_number) as unique_students
                FROM daily_fee_collection 
                WHERE school_id = ? 
                AND academic_year = ?
                AND DATE(bill_date) BETWEEN ? AND ?
                GROUP BY DATE(bill_date)
                ORDER BY collection_date DESC
            """;

            List<Map<String, Object>> summary = jdbc.queryForList(
                    sql, schoolId, academicYear, startDate, endDate
            );

            // Calculate totals
            double totalPaid = 0.0;
            double totalConcession = 0.0;
            int totalTransactions = 0;
            int totalStudents = 0;

            for (Map<String, Object> day : summary) {
                totalPaid += convertToDouble(day.get("daily_paid_total"));
                totalConcession += convertToDouble(day.get("daily_concession_total"));
                totalTransactions += convertToDouble(day.get("transaction_count")).intValue();
                totalStudents += convertToDouble(day.get("unique_students")).intValue();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("summary", summary);
            response.put("totalPaid", totalPaid);
            response.put("totalConcession", totalConcession);
            response.put("totalTransactions", totalTransactions);
            response.put("totalStudents", totalStudents);
            response.put("periodDays", days);
            response.put("startDate", startDate.toString());
            response.put("endDate", endDate.toString());
            response.put("schoolId", schoolId);
            response.put("academicYear", academicYear);

            log.info("📊 Collection summary generated - School: {}, Period: {} days, Total Paid: ₹{}, Total Concession: ₹{}",
                    schoolId, days, totalPaid, totalConcession);

            return response;

        } catch (Exception e) {
            log.error("❌ Error generating collection summary for school {}: {}", schoolId, e.getMessage());

            Map<String, Object> emptyResponse = new HashMap<>();
            emptyResponse.put("summary", new ArrayList<>());
            emptyResponse.put("totalPaid", 0.0);
            emptyResponse.put("totalConcession", 0.0);
            emptyResponse.put("totalTransactions", 0);
            emptyResponse.put("totalStudents", 0);
            emptyResponse.put("periodDays", period);
            emptyResponse.put("startDate", "");
            emptyResponse.put("endDate", "");
            emptyResponse.put("schoolId", schoolId);
            emptyResponse.put("academicYear", academicYear);

            return emptyResponse;
        }
    }

    // Get comprehensive collection statistics
    public Map<String, Object> getCollectionStatistics(String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            ensureTablesExist(jdbc);

            // Get current academic year statistics
            String sql = """
                SELECT 
                    COUNT(DISTINCT bill_number) as total_transactions,
                    COUNT(*) as total_fee_items,
                    SUM(paid_amount) as total_collection,
                    SUM(concession_amount) as total_concession,
                    SUM(net_paid_amount) as total_net_collection,
                    AVG(paid_amount) as average_transaction,
                    MAX(paid_amount) as max_transaction,
                    MIN(paid_amount) as min_transaction,
                    COUNT(DISTINCT admission_number) as unique_students,
                    COUNT(DISTINCT DATE(bill_date)) as collection_days
                FROM daily_fee_collection 
                WHERE school_id = ? 
                AND academic_year = ?
            """;

            Map<String, Object> stats = jdbc.queryForMap(sql, schoolId, academicYear);

            // Get payment mode distribution
            String paymentModeSql = """
                SELECT 
                    payment_mode,
                    COUNT(*) as transaction_count,
                    SUM(paid_amount) as total_paid,
                    SUM(concession_amount) as total_concession
                FROM daily_fee_collection 
                WHERE school_id = ? 
                AND academic_year = ?
                GROUP BY payment_mode
                ORDER BY total_paid DESC
            """;

            List<Map<String, Object>> paymentModes = jdbc.queryForList(
                    paymentModeSql, schoolId, academicYear
            );

            // Get top fee heads
            String feeHeadSql = """
                SELECT 
                    fee_head,
                    COUNT(*) as transaction_count,
                    SUM(paid_amount) as total_paid,
                    SUM(concession_amount) as total_concession
                FROM daily_fee_collection 
                WHERE school_id = ? 
                AND academic_year = ?
                GROUP BY fee_head
                ORDER BY total_paid DESC
                LIMIT 10
            """;

            List<Map<String, Object>> topFeeHeads = jdbc.queryForList(
                    feeHeadSql, schoolId, academicYear
            );

            // Calculate daily averages
            Double totalCollection = convertToDouble(stats.get("total_collection"));
            Long collectionDays = convertToDouble(stats.get("collection_days")).longValue();

            if (totalCollection != null && collectionDays != null && collectionDays > 0) {
                stats.put("daily_average", totalCollection / collectionDays);
            } else {
                stats.put("daily_average", 0.0);
            }

            // Calculate collection efficiency
            Double totalNet = convertToDouble(stats.get("total_net_collection"));
            if (totalNet != null && totalNet > 0) {
                double efficiency = (convertToDouble(stats.get("total_collection")) / totalNet) * 100;
                stats.put("collection_efficiency", Math.round(efficiency * 100.0) / 100.0);
            } else {
                stats.put("collection_efficiency", 0.0);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("overallStats", stats);
            response.put("paymentModes", paymentModes);
            response.put("topFeeHeads", topFeeHeads);
            response.put("schoolId", schoolId);
            response.put("academicYear", academicYear);
            response.put("generatedOn", LocalDateTime.now());

            log.info("📈 Collection statistics generated - School: {}, Total Collection: ₹{}, Total Concession: ₹{}",
                    schoolId, totalCollection, convertToDouble(stats.get("total_concession")));

            return response;

        } catch (Exception e) {
            log.error("❌ Error fetching collection statistics for school {}: {}", schoolId, e.getMessage());

            // Return default statistics
            Map<String, Object> defaultStats = new HashMap<>();
            defaultStats.put("total_transactions", 0);
            defaultStats.put("total_fee_items", 0);
            defaultStats.put("total_collection", 0.0);
            defaultStats.put("total_concession", 0.0);
            defaultStats.put("total_net_collection", 0.0);
            defaultStats.put("average_transaction", 0.0);
            defaultStats.put("max_transaction", 0.0);
            defaultStats.put("min_transaction", 0.0);
            defaultStats.put("unique_students", 0);
            defaultStats.put("collection_days", 0);
            defaultStats.put("daily_average", 0.0);
            defaultStats.put("collection_efficiency", 0.0);

            Map<String, Object> response = new HashMap<>();
            response.put("overallStats", defaultStats);
            response.put("paymentModes", new ArrayList<>());
            response.put("topFeeHeads", new ArrayList<>());
            response.put("schoolId", schoolId);
            response.put("academicYear", academicYear);
            response.put("generatedOn", LocalDateTime.now());

            return response;
        }
    }

    // Get detailed day collection for frontend (compatible method)
    public List<Map<String, Object>> getDayCollection(String schoolId, String date, String academicYear) {
        Map<String, Object> report = getDayCollectionReport(date, schoolId, academicYear);
        return (List<Map<String, Object>>) report.get("collections");
    }

    // Get detailed periodical collection for frontend (compatible method)
    public List<Map<String, Object>> getPeriodicalCollection(String schoolId, String startDate, String endDate, String academicYear) {
        Map<String, Object> report = getPeriodicalCollectionReport(startDate, endDate, schoolId, academicYear);
        return (List<Map<String, Object>>) report.get("collections");
    }

    // Get total collection amount for a period
    public Double getTotalCollection(String schoolId, String startDate, String endDate, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            String sql = """
                SELECT SUM(paid_amount) as total_collection
                FROM daily_fee_collection 
                WHERE school_id = ? 
                AND academic_year = ?
                AND DATE(bill_date) BETWEEN ? AND ?
            """;

            Double totalCollection = jdbc.queryForObject(sql, Double.class,
                    schoolId, academicYear, start, end);

            return totalCollection != null ? totalCollection : 0.0;

        } catch (Exception e) {
            log.error("Error calculating total collection for school {} from {} to {}: {}",
                    schoolId, startDate, endDate, e.getMessage());
            return 0.0;
        }
    }

    // Helper method to convert any object to Double safely
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

    // Helper method to convert timestamp
    private LocalDateTime convertTimestamp(Object timestampObj) {
        if (timestampObj == null) {
            return null;
        }
        if (timestampObj instanceof Timestamp) {
            return ((Timestamp) timestampObj).toLocalDateTime();
        } else if (timestampObj instanceof LocalDateTime) {
            return (LocalDateTime) timestampObj;
        } else if (timestampObj instanceof java.util.Date) {
            return ((java.util.Date) timestampObj).toInstant()
                    .atZone(java.time.ZoneId.systemDefault())
                    .toLocalDateTime();
        }
        return null;
    }

    // Additional method: Get monthly collection report
    public Map<String, Object> getMonthlyCollectionReport(String schoolId, String month, String year, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            // Parse month and year
            int monthNum = Integer.parseInt(month);
            int yearNum = Integer.parseInt(year);

            LocalDate startDate = LocalDate.of(yearNum, monthNum, 1);
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

            return getPeriodicalCollectionReport(
                    startDate.toString(),
                    endDate.toString(),
                    schoolId,
                    academicYear
            );

        } catch (Exception e) {
            log.error("Error generating monthly collection report: {}", e.getMessage());
            throw new RuntimeException("Failed to generate monthly report: " + e.getMessage(), e);
        }
    }
}