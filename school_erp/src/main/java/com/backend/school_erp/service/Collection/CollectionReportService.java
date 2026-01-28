package com.backend.school_erp.service.Collection;

import com.backend.school_erp.DTO.Collection.MOCollectionReportDTO;
import com.backend.school_erp.DTO.Collection.MOCollectionReportResponse;
import com.backend.school_erp.DTO.Collection.MODayCollectionRequest;
import com.backend.school_erp.DTO.Collection.MOPeriodicalCollectionRequest;
import com.backend.school_erp.config.DatabaseConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class CollectionReportService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

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

    // Convert java.sql.Timestamp to java.time.LocalDateTime safely
    private LocalDateTime convertToLocalDateTime(Object timestamp) {
        if (timestamp == null) {
            return null;
        }
        if (timestamp instanceof Timestamp) {
            return ((Timestamp) timestamp).toLocalDateTime();
        } else if (timestamp instanceof LocalDateTime) {
            return (LocalDateTime) timestamp;
        } else {
            return null;
        }
    }

    // Generic method to fetch and group reports from the NEW miscellaneous_fee_collection table
    private List<MOCollectionReportDTO> generateReportData(String schoolId, String academicYear, LocalDateTime startDate, LocalDateTime endDate) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        // We query the detailed transaction table
        // This table has one row per Fee Head per Bill
        String sql = """
            SELECT 
                bill_number,
                admission_number,
                student_name,
                standard,
                section,
                bill_date,
                fee_head,
                paid_amount,
                concession_amount,
                net_paid_amount,
                payment_mode,
                payment_number,
                created_at
            FROM miscellaneous_fee_collection
            WHERE school_id = ? 
            AND academic_year = ?
            AND bill_date BETWEEN ? AND ?
            ORDER BY bill_date DESC, bill_number DESC
        """;

        List<Map<String, Object>> rows = jdbc.queryForList(
                sql,
                schoolId,
                academicYear,
                java.sql.Timestamp.valueOf(startDate),
                java.sql.Timestamp.valueOf(endDate)
        );

        // Map to group details by Bill Number
        Map<String, MOCollectionReportDTO> billMap = new LinkedHashMap<>();

        for (Map<String, Object> row : rows) {
            String billNumber = (String) row.get("bill_number");
            Double paidAmount = ((Number) row.get("paid_amount")).doubleValue();
            Double concessionAmount = ((Number) row.get("concession_amount")).doubleValue();
            String feeHead = (String) row.get("fee_head");

            // If Bill doesn't exist in map yet, create it
            if (!billMap.containsKey(billNumber)) {
                MOCollectionReportDTO dto = new MOCollectionReportDTO();
                dto.setBillNumber(billNumber);
                dto.setAdmissionNumber((String) row.get("admission_number"));
                dto.setStudentName((String) row.get("student_name"));
                dto.setStandard((String) row.get("standard"));
                dto.setSection((String) row.get("section"));
                dto.setTimestamp(convertToLocalDateTime(row.get("bill_date")));
                dto.setCreatedDate(convertToLocalDateTime(row.get("created_at")));
                dto.setPaymentMode((String) row.get("payment_mode"));
                dto.setPaymentNumber((String) row.get("payment_number"));
                dto.setFeeType("OTHER"); // Standard type for this report

                // Initialize aggregators
                dto.setTotalPaidAmount(0.0);
                dto.setTotalConcessionAmount(0.0);
                dto.setFeeDetails(new ArrayList<>());

                billMap.put(billNumber, dto);
            }

            // Update the existing Bill DTO with this row's specific data
            MOCollectionReportDTO currentBill = billMap.get(billNumber);

            // 1. Accumulate Totals
            currentBill.setTotalPaidAmount(currentBill.getTotalPaidAmount() + paidAmount);
            currentBill.setTotalConcessionAmount(currentBill.getTotalConcessionAmount() + concessionAmount);

            // 2. Add Fee Head Detail (Structure expected by frontend)
            Map<String, Object> feeDetail = new HashMap<>();
            feeDetail.put("feeHead", feeHead);
            feeDetail.put("amount", paidAmount);
            currentBill.getFeeDetails().add(feeDetail);
        }

        // Finalize DTOs (create comma-separated description string)
        List<MOCollectionReportDTO> reportList = new ArrayList<>(billMap.values());
        for (MOCollectionReportDTO dto : reportList) {
            String desc = dto.getFeeDetails().stream()
                    .map(m -> (String) m.get("feeHead"))
                    .collect(Collectors.joining(", "));
            dto.setDescription(desc);
        }

        return reportList;
    }

    public MOCollectionReportResponse getDayCollectionReport(MODayCollectionRequest request) {
        try {
            List<MOCollectionReportDTO> collections = generateReportData(
                    request.getSchoolId(),
                    request.getAcademicYear(),
                    request.getStartDate(),
                    request.getEndDate()
            );

            double totalCollection = collections.stream().mapToDouble(MOCollectionReportDTO::getTotalPaidAmount).sum();
            double totalConcession = collections.stream().mapToDouble(MOCollectionReportDTO::getTotalConcessionAmount).sum();

            Map<String, Object> summary = new HashMap<>();
            summary.put("totalCollection", totalCollection);
            summary.put("totalConcession", totalConcession);
            summary.put("transactionCount", collections.size());
            summary.put("netCollection", totalCollection);
            summary.put("reportDate", request.getStartDate().toLocalDate().toString());

            return MOCollectionReportResponse.builder()
                    .success(true)
                    .message("Day collection report generated successfully")
                    .data(collections)
                    .summary(summary)
                    .reportType("DAY_COLLECTION")
                    .academicYear(request.getAcademicYear())
                    .period(request.getStartDate().toLocalDate().toString())
                    .build();

        } catch (Exception e) {
            log.error("Error generating day collection report for school {}: {}", request.getSchoolId(), e.getMessage(), e);
            return MOCollectionReportResponse.builder()
                    .success(false)
                    .message("Failed to generate day collection report: " + e.getMessage())
                    .data(new ArrayList<>())
                    .summary(new HashMap<>())
                    .build();
        }
    }

    public MOCollectionReportResponse getPeriodicalCollectionReport(MOPeriodicalCollectionRequest request) {
        try {
            List<MOCollectionReportDTO> collections = generateReportData(
                    request.getSchoolId(),
                    request.getAcademicYear(),
                    request.getStartDate(),
                    request.getEndDate()
            );

            double totalCollection = collections.stream().mapToDouble(MOCollectionReportDTO::getTotalPaidAmount).sum();
            double totalConcession = collections.stream().mapToDouble(MOCollectionReportDTO::getTotalConcessionAmount).sum();

            // Prepare summary with date-wise breakdown
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalCollection", totalCollection);
            summary.put("totalConcession", totalConcession);
            summary.put("transactionCount", collections.size());
            summary.put("netCollection", totalCollection);
            summary.put("startDate", request.getStartDate().toLocalDate().toString());
            summary.put("endDate", request.getEndDate().toLocalDate().toString());

            // Group by date for Periodical Summary
            Map<String, List<MOCollectionReportDTO>> dateWiseCollections = collections.stream()
                    .collect(Collectors.groupingBy(dto -> dto.getTimestamp().toLocalDate().toString()));

            summary.put("dateWiseBreakdown", getDateWiseSummary(dateWiseCollections));

            return MOCollectionReportResponse.builder()
                    .success(true)
                    .message("Periodical collection report generated successfully")
                    .data(collections)
                    .summary(summary)
                    .reportType("PERIODICAL_COLLECTION")
                    .academicYear(request.getAcademicYear())
                    .period(request.getStartDate().toLocalDate().toString() + " to " + request.getEndDate().toLocalDate().toString())
                    .build();

        } catch (Exception e) {
            log.error("Error generating periodical collection report for school {}: {}", request.getSchoolId(), e.getMessage(), e);
            return MOCollectionReportResponse.builder()
                    .success(false)
                    .message("Failed to generate periodical collection report: " + e.getMessage())
                    .data(new ArrayList<>())
                    .summary(new HashMap<>())
                    .build();
        }
    }

    private Map<String, Map<String, Object>> getDateWiseSummary(Map<String, List<MOCollectionReportDTO>> dateWiseCollections) {
        Map<String, Map<String, Object>> dateWiseSummary = new HashMap<>();

        for (Map.Entry<String, List<MOCollectionReportDTO>> entry : dateWiseCollections.entrySet()) {
            String date = entry.getKey();
            List<MOCollectionReportDTO> dailyCollections = entry.getValue();

            double dailyTotal = dailyCollections.stream()
                    .mapToDouble(MOCollectionReportDTO::getTotalPaidAmount)
                    .sum();
            double dailyConcession = dailyCollections.stream()
                    .mapToDouble(MOCollectionReportDTO::getTotalConcessionAmount)
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

    public Map<String, String> getSchoolInfo(String schoolId) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            // Assuming a table structure for school info, or return default
            // This part matches the previous implementation's error handling logic
            // Ideally, this should query a 'school_master' or 'settings' table

            Map<String, String> defaultInfo = new HashMap<>();
            defaultInfo.put("name", "School Name");
            defaultInfo.put("address", "School Address");

            try {
                // Try to fetch from schools table if it exists (Optional: depends on your setup)
                List<Map<String, Object>> result = jdbc.queryForList("SELECT school_name, school_address FROM school_master LIMIT 1");
                if(!result.isEmpty()) {
                    defaultInfo.put("name", (String) result.get(0).get("school_name"));
                    defaultInfo.put("address", (String) result.get(0).get("school_address"));
                }
            } catch (Exception e) {
                // Table doesn't exist, ignore
            }
            return defaultInfo;

        } catch (Exception e) {
            log.error("Error fetching school info for {}: {}", schoolId, e.getMessage());
            Map<String, String> defaultInfo = new HashMap<>();
            defaultInfo.put("name", "School Name");
            defaultInfo.put("address", "School Address");
            return defaultInfo;
        }
    }
}