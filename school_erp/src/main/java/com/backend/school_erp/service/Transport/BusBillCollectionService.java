package com.backend.school_erp.service.Transport;

import com.backend.school_erp.config.DatabaseConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class BusBillCollectionService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("Creating HikariCP DataSource for school: {}", id);
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

    // Parse bus fee payments JSON to extract fee details
    private List<Map<String, Object>> parseBusFeePayments(String busFeePaymentsJson) {
        try {
            if (busFeePaymentsJson == null || busFeePaymentsJson.trim().isEmpty()) {
                return new ArrayList<>();
            }

            return objectMapper.readValue(
                    busFeePaymentsJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
            );
        } catch (Exception e) {
            log.warn("Failed to parse bus fee payments JSON: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    // Get bus fee description from fee payments
    private String getBusFeeDescription(List<Map<String, Object>> busFeePayments) {
        if (busFeePayments == null || busFeePayments.isEmpty()) {
            return "Bus Fee Payment";
        }

        StringBuilder description = new StringBuilder();
        for (Map<String, Object> busFeePayment : busFeePayments) {
            String feeHead = (String) busFeePayment.get("feeHead");
            if (feeHead != null) {
                if (description.length() > 0) {
                    description.append(", ");
                }
                description.append(feeHead);
            }
        }

        return description.length() > 0 ? description.toString() : "Bus Fee Payment";
    }

    // Safely extract and convert timestamp from result set
    private LocalDateTime extractTimestamp(Map<String, Object> row, String columnName) {
        Object value = row.get(columnName);
        if (value instanceof Timestamp) {
            return ((Timestamp) value).toLocalDateTime();
        } else if (value instanceof LocalDateTime) {
            return (LocalDateTime) value;
        } else if (value instanceof java.util.Date) {
            return ((java.util.Date) value).toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
        }
        return null;
    }

    public Map<String, Object> getDayCollectionReport(String date, String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            // Parse date and set time range for the entire day
            LocalDate reportDate = LocalDate.parse(date);
            LocalDateTime startDateTime = reportDate.atStartOfDay();
            LocalDateTime endDateTime = reportDate.atTime(23, 59, 59);

            String sql = """
                SELECT 
                    bus_bill_number,
                    admission_number,
                    student_name,
                    father_name,
                    standard,
                    section,
                    boarding_point,
                    bus_bill_date,
                    original_bus_amount,
                    bus_paid_amount,
                    remaining_balance,
                    total_bus_paid_amount,
                    total_bus_concession_amount,
                    bus_fee_payments_json,
                    payment_mode,
                    payment_number,
                    operator_name,
                    route_number,
                    transaction_date,
                    transaction_narrative
                FROM bus_bill_entries 
                WHERE school_id = ? 
                AND academic_year = ?
                AND bus_bill_date BETWEEN ? AND ?
                ORDER BY bus_bill_date DESC
            """;

            List<Map<String, Object>> results = jdbc.queryForList(
                    sql, schoolId, academicYear, startDateTime, endDateTime
            );

            List<Map<String, Object>> collections = new ArrayList<>();
            double totalCollection = 0.0;
            double totalConcession = 0.0;
            int transactionCount = results.size();

            for (Map<String, Object> row : results) {
                String busFeePaymentsJson = (String) row.get("bus_fee_payments_json");
                List<Map<String, Object>> busFeePayments = parseBusFeePayments(busFeePaymentsJson);
                String description = getBusFeeDescription(busFeePayments);

                // Safely extract and convert timestamp
                LocalDateTime timestamp = extractTimestamp(row, "bus_bill_date");

                Map<String, Object> collection = new HashMap<>();
                collection.put("billNumber", row.get("bus_bill_number"));
                collection.put("admissionNumber", row.get("admission_number"));
                collection.put("studentName", row.get("student_name"));
                collection.put("fatherName", row.get("father_name"));
                collection.put("standard", row.get("standard"));
                collection.put("section", row.get("section"));
                collection.put("boardingPoint", row.get("boarding_point"));
                collection.put("routeNumber", row.get("route_number"));
                collection.put("timestamp", timestamp);

                // Use doubleValue safely
                collection.put("originalAmount", row.get("original_bus_amount") != null ? ((Number) row.get("original_bus_amount")).doubleValue() : 0.0);
                collection.put("paidAmount", row.get("bus_paid_amount") != null ? ((Number) row.get("bus_paid_amount")).doubleValue() : 0.0);
                collection.put("totalPaidAmount", row.get("total_bus_paid_amount") != null ? ((Number) row.get("total_bus_paid_amount")).doubleValue() : 0.0);

                // Map remaining_balance correctly
                collection.put("balanceAmount", row.get("remaining_balance") != null ? ((Number) row.get("remaining_balance")).doubleValue() : 0.0);

                collection.put("concession", row.get("total_bus_concession_amount") != null ? ((Number) row.get("total_bus_concession_amount")).doubleValue() : 0.0);
                collection.put("busFeeDetails", busFeePayments);
                collection.put("description", description);
                collection.put("paymentMode", row.get("payment_mode"));
                collection.put("paymentNumber", row.get("payment_number"));
                collection.put("operatorName", row.get("operator_name"));
                collection.put("transactionDate", extractTimestamp(row, "transaction_date"));
                collection.put("transactionNarrative", row.get("transaction_narrative"));

                collections.add(collection);
                totalCollection += ((Number) row.get("total_bus_paid_amount")).doubleValue();
                totalConcession += ((Number) row.get("total_bus_concession_amount")).doubleValue();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("collections", collections);
            response.put("totalCollection", totalCollection);
            response.put("totalConcession", totalConcession);
            response.put("netCollection", totalCollection);
            response.put("reportDate", date);
            response.put("academicYear", academicYear);
            response.put("transactionCount", transactionCount);
            response.put("reportType", "BUS_DAY_COLLECTION");

            // Add school info
            Map<String, String> schoolInfo = getSchoolInfo(schoolId);
            response.put("schoolInfo", schoolInfo);

            return response;

        } catch (Exception e) {
            log.error("Error generating bus day collection report for school {} on date {}: {}",
                    schoolId, date, e.getMessage(), e);
            throw new RuntimeException("Failed to generate bus day collection report: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getPeriodicalCollectionReport(String startDate, String endDate, String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            // Parse dates and set time range
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            LocalDateTime startDateTime = start.atStartOfDay();
            LocalDateTime endDateTime = end.atTime(23, 59, 59);

            String sql = """
                SELECT 
                    bus_bill_number,
                    admission_number,
                    student_name,
                    father_name,
                    standard,
                    section,
                    boarding_point,
                    bus_bill_date,
                    original_bus_amount,
                    bus_paid_amount,
                    remaining_balance,
                    total_bus_paid_amount,
                    total_bus_concession_amount,
                    bus_fee_payments_json,
                    payment_mode,
                    payment_number,
                    operator_name,
                    route_number,
                    transaction_date,
                    transaction_narrative
                FROM bus_bill_entries 
                WHERE school_id = ? 
                AND academic_year = ?
                AND bus_bill_date BETWEEN ? AND ?
                ORDER BY bus_bill_date, admission_number
            """;

            List<Map<String, Object>> results = jdbc.queryForList(
                    sql, schoolId, academicYear, startDateTime, endDateTime
            );

            List<Map<String, Object>> collections = new ArrayList<>();
            double totalCollection = 0.0;
            double totalConcession = 0.0;
            int transactionCount = results.size();

            // Group by date for additional processing
            Map<String, List<Map<String, Object>>> dateWiseCollections = new HashMap<>();

            for (Map<String, Object> row : results) {
                String busFeePaymentsJson = (String) row.get("bus_fee_payments_json");
                List<Map<String, Object>> busFeePayments = parseBusFeePayments(busFeePaymentsJson);
                String description = getBusFeeDescription(busFeePayments);

                // Safely extract and convert timestamp
                LocalDateTime timestamp = extractTimestamp(row, "bus_bill_date");
                String dateKey = timestamp != null ? timestamp.toLocalDate().toString() : "Unknown Date";

                Map<String, Object> collection = new HashMap<>();
                collection.put("billNumber", row.get("bus_bill_number"));
                collection.put("admissionNumber", row.get("admission_number"));
                collection.put("studentName", row.get("student_name"));
                collection.put("fatherName", row.get("father_name"));
                collection.put("standard", row.get("standard"));
                collection.put("section", row.get("section"));
                collection.put("boardingPoint", row.get("boarding_point"));
                collection.put("routeNumber", row.get("route_number"));
                collection.put("timestamp", timestamp);

                // Use doubleValue safely
                collection.put("originalAmount", row.get("original_bus_amount") != null ? ((Number) row.get("original_bus_amount")).doubleValue() : 0.0);
                collection.put("paidAmount", row.get("bus_paid_amount") != null ? ((Number) row.get("bus_paid_amount")).doubleValue() : 0.0);
                collection.put("totalPaidAmount", row.get("total_bus_paid_amount") != null ? ((Number) row.get("total_bus_paid_amount")).doubleValue() : 0.0);
                collection.put("balanceAmount", row.get("remaining_balance") != null ? ((Number) row.get("remaining_balance")).doubleValue() : 0.0);
                collection.put("concession", row.get("total_bus_concession_amount") != null ? ((Number) row.get("total_bus_concession_amount")).doubleValue() : 0.0);

                collection.put("busFeeDetails", busFeePayments);
                collection.put("description", description);
                collection.put("paymentMode", row.get("payment_mode"));
                collection.put("paymentNumber", row.get("payment_number"));
                collection.put("operatorName", row.get("operator_name"));
                collection.put("transactionDate", extractTimestamp(row, "transaction_date"));
                collection.put("transactionNarrative", row.get("transaction_narrative"));

                collections.add(collection);
                totalCollection += ((Number) row.get("total_bus_paid_amount")).doubleValue();
                totalConcession += ((Number) row.get("total_bus_concession_amount")).doubleValue();

                // Group by date
                dateWiseCollections.computeIfAbsent(dateKey, k -> new ArrayList<>()).add(collection);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("collections", collections);
            response.put("totalCollection", totalCollection);
            response.put("totalConcession", totalConcession);
            response.put("netCollection", totalCollection);
            response.put("startDate", startDate);
            response.put("endDate", endDate);
            response.put("academicYear", academicYear);
            response.put("transactionCount", transactionCount);
            response.put("reportType", "BUS_PERIODICAL_COLLECTION");

            // Add date-wise breakdown
            response.put("dateWiseBreakdown", getDateWiseSummary(dateWiseCollections));

            // Add school info
            Map<String, String> schoolInfo = getSchoolInfo(schoolId);
            response.put("schoolInfo", schoolInfo);

            return response;

        } catch (Exception e) {
            log.error("Error generating bus periodical collection report: {}", e.getMessage());
            throw new RuntimeException("Failed to generate bus periodical collection report: " + e.getMessage(), e);
        }
    }

    private Map<String, Map<String, Object>> getDateWiseSummary(Map<String, List<Map<String, Object>>> dateWiseCollections) {
        Map<String, Map<String, Object>> dateWiseSummary = new HashMap<>();

        for (Map.Entry<String, List<Map<String, Object>>> entry : dateWiseCollections.entrySet()) {
            String date = entry.getKey();
            List<Map<String, Object>> dailyCollections = entry.getValue();

            double dailyTotal = dailyCollections.stream()
                    .mapToDouble(collection -> (Double) collection.get("totalPaidAmount"))
                    .sum();
            double dailyConcession = dailyCollections.stream()
                    .mapToDouble(collection -> (Double) collection.get("concession"))
                    .sum();

            Map<String, Object> dailySummary = new HashMap<>();
            dailySummary.put("transactionCount", dailyCollections.size());
            dailySummary.put("totalCollection", dailyTotal);
            dailySummary.put("totalConcession", dailyConcession);
            dailySummary.put("netCollection", dailyTotal);

            dateWiseSummary.put(date, dailySummary);
        }

        return dateWiseSummary;
    }

    public Map<String, Object> getCollectionSummary(String schoolId, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            String sql = """
                SELECT 
                    DATE(bus_bill_date) as collection_date,
                    COUNT(*) as transaction_count,
                    SUM(total_bus_paid_amount) as daily_total,
                    SUM(total_bus_concession_amount) as daily_concession
                FROM bus_bill_entries 
                WHERE school_id = ? 
                AND academic_year = ?
                GROUP BY DATE(bus_bill_date)
                ORDER BY collection_date DESC
                LIMIT 30
            """;

            List<Map<String, Object>> summary = jdbc.queryForList(sql, schoolId, academicYear);

            Map<String, Object> response = new HashMap<>();
            response.put("summary", summary);
            response.put("schoolId", schoolId);
            response.put("academicYear", academicYear);

            return response;

        } catch (Exception e) {
            log.error("Error generating bus collection summary: {}", e.getMessage());
            throw new RuntimeException("Failed to generate bus collection summary: " + e.getMessage(), e);
        }
    }

    // Get school information for report headers
    private Map<String, String> getSchoolInfo(String schoolId) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            // Try to get school info, return defaults if table or data doesn't exist
            try {
                String sql = "SELECT name, address FROM schools WHERE id = ?";
                return jdbc.queryForObject(sql, (rs, rowNum) -> {
                    Map<String, String> schoolInfo = new HashMap<>();
                    schoolInfo.put("name", rs.getString("name"));
                    schoolInfo.put("address", rs.getString("address"));
                    return schoolInfo;
                }, schoolId);
            } catch (Exception e) {
                Map<String, String> defaultInfo = new HashMap<>();
                defaultInfo.put("name", "School Name");
                defaultInfo.put("address", "School Address");
                return defaultInfo;
            }
        } catch (Exception e) {
            Map<String, String> defaultInfo = new HashMap<>();
            defaultInfo.put("name", "School Name");
            defaultInfo.put("address", "School Address");
            return defaultInfo;
        }
    }
}