package com.backend.school_erp.service.Transaction;

import com.backend.school_erp.DTO.Transaction.DailyFeeCollectionDTO;
import com.backend.school_erp.DTO.Transaction.MiscellaneousFeeCollectionResponseDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Transaction.DailyFeeCollection;
import com.backend.school_erp.entity.Transaction.MiscellaneousFeeCollection;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class DuplicateBillService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public DuplicateBillService() {
        this.objectMapper = new ObjectMapper();
    }

    // --- DataSource Management ---

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating HikariCP DataSource for school: {}", id);
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
            config.setLeakDetectionThreshold(10000);

            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    // --- Main Search Methods ---

    public DailyFeeCollectionDTO searchDailyFeeCollection(String schoolId, String academicYear, String billNumber) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            // First check if the bill exists
            String checkSql = "SELECT COUNT(*) FROM daily_fee_collection WHERE bill_number = ? AND school_id = ?";
            Integer count = jdbc.queryForObject(checkSql, Integer.class, billNumber, schoolId);

            if (count == null || count == 0) {
                log.warn("❌ Daily fee bill not found: {} for school: {}", billNumber, schoolId);
                return null;
            }

            // Fetch ALL rows for this bill number
            String sql = """
                SELECT 
                    d.*,
                    COALESCE(dfp.total_paid, 0) as total_paid,
                    COALESCE(dfc.total_concession, 0) as total_concession
                FROM daily_fee_collection d
                LEFT JOIN (
                    SELECT bill_number, admission_number, SUM(paid_amount) as total_paid
                    FROM daily_fee_collection 
                    WHERE bill_number = ? AND school_id = ?
                    GROUP BY bill_number, admission_number
                ) dfp ON d.bill_number = dfp.bill_number AND d.admission_number = dfp.admission_number
                LEFT JOIN (
                    SELECT bill_number, admission_number, SUM(concession_amount) as total_concession
                    FROM daily_fee_collection 
                    WHERE bill_number = ? AND school_id = ?
                    GROUP BY bill_number, admission_number
                ) dfc ON d.bill_number = dfc.bill_number AND d.admission_number = dfc.admission_number
                WHERE d.bill_number = ? AND d.school_id = ?
                ORDER BY d.fee_head
            """;

            List<DailyFeeCollection> rows = jdbc.query(
                    sql,
                    new BeanPropertyRowMapper<>(DailyFeeCollection.class),
                    billNumber, schoolId,
                    billNumber, schoolId,
                    billNumber, schoolId
            );

            if (rows.isEmpty()) {
                log.warn("❌ Bill not found: {}", billNumber);
                return null;
            }

            // Get student payment history for balance calculation
            Map<String, Object> balanceInfo = getStudentBalanceInfo(
                    jdbc, schoolId, academicYear,
                    rows.get(0).getAdmissionNumber()
            );

            // Aggregate rows into a single DTO
            return aggregateRowsToDTO(rows, balanceInfo);

        } catch (Exception e) {
            log.error("❌ Error searching daily fee bill {}: {}", billNumber, e.getMessage());
            throw new RuntimeException("Failed to search bill: " + e.getMessage(), e);
        }
    }

    public MiscellaneousFeeCollectionResponseDTO searchMiscellaneousFeeEntry(String schoolId, String academicYear, String billNumber) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            // Check if bill exists
            String checkSql = "SELECT COUNT(*) FROM miscellaneous_fee_collection WHERE bill_number = ? AND school_id = ?";
            Integer count = jdbc.queryForObject(checkSql, Integer.class, billNumber, schoolId);

            if (count == null || count == 0) {
                log.warn("❌ Miscellaneous fee bill not found: {} for school: {}", billNumber, schoolId);
                return null;
            }

            // Fetch all rows for this miscellaneous fee bill
            String sql = """
                SELECT 
                    m.*,
                    COALESCE(mfp.total_paid, 0) as total_paid,
                    COALESCE(mfc.total_concession, 0) as total_concession
                FROM miscellaneous_fee_collection m
                LEFT JOIN (
                    SELECT bill_number, admission_number, SUM(paid_amount) as total_paid
                    FROM miscellaneous_fee_collection 
                    WHERE bill_number = ? AND school_id = ?
                    GROUP BY bill_number, admission_number
                ) mfp ON m.bill_number = mfp.bill_number AND m.admission_number = mfp.admission_number
                LEFT JOIN (
                    SELECT bill_number, admission_number, SUM(concession_amount) as total_concession
                    FROM miscellaneous_fee_collection 
                    WHERE bill_number = ? AND school_id = ?
                    GROUP BY bill_number, admission_number
                ) mfc ON m.bill_number = mfc.bill_number AND m.admission_number = mfc.admission_number
                WHERE m.bill_number = ? AND m.school_id = ?
                ORDER BY m.fee_head
            """;

            List<MiscellaneousFeeCollection> entries = jdbc.query(
                    sql,
                    new MiscellaneousFeeCollectionRowMapper(),
                    billNumber, schoolId,
                    billNumber, schoolId,
                    billNumber, schoolId
            );

            if (entries.isEmpty()) {
                log.warn("❌ Miscellaneous fee bill not found: {}", billNumber);
                return null;
            }

            // Get student info for balance calculation
            Map<String, Object> balanceInfo = getStudentBalanceInfo(
                    jdbc, schoolId, academicYear,
                    entries.get(0).getAdmissionNumber()
            );

            return convertToMiscellaneousFeeResponseDTO(entries, balanceInfo);

        } catch (Exception e) {
            log.error("❌ Error searching miscellaneous fees: {}", e.getMessage());
            throw new RuntimeException("Failed to search miscellaneous fee bill: " + e.getMessage(), e);
        }
    }

    // --- Helper Methods ---

    private Map<String, Object> getStudentBalanceInfo(JdbcTemplate jdbc, String schoolId,
                                                      String academicYear, String admissionNumber) {
        Map<String, Object> result = new HashMap<>();
        try {
            // Get total fees for the student
            String feesSql = """
                SELECT 
                    COALESCE(SUM(
                        COALESCE(tf.amount, 0) + 
                        COALESCE(hf.amount, 0) + 
                        COALESCE(trf.amount, 0)
                    ), 0) as total_fees
                FROM (
                    SELECT amount FROM tuition_fees_? WHERE admission_number = ? AND school_id = ?
                    UNION ALL
                    SELECT amount FROM hostel_fees_? WHERE admission_number = ? AND school_id = ?
                    UNION ALL
                    SELECT amount FROM transport_fees_? WHERE admission_number = ? AND school_id = ?
                ) AS combined_fees
            """;

            // Replace year placeholders
            String yearSuffix = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
            feesSql = feesSql.replace("?", yearSuffix);

            Double totalFees = jdbc.queryForObject(feesSql, Double.class,
                    admissionNumber, schoolId,
                    admissionNumber, schoolId,
                    admissionNumber, schoolId
            );

            // Get total paid amount (excluding current bill)
            String paidSql = """
                SELECT COALESCE(SUM(net_paid_amount), 0) 
                FROM daily_fee_collection 
                WHERE school_id = ? AND admission_number = ? AND academic_year = ?
                AND bill_number != ?
            """;

            // We don't have current bill number here, so we'll get all payments
            String allPaidSql = """
                SELECT COALESCE(SUM(net_paid_amount), 0) 
                FROM daily_fee_collection 
                WHERE school_id = ? AND admission_number = ? AND academic_year = ?
            """;

            Double totalPaid = jdbc.queryForObject(allPaidSql, Double.class,
                    schoolId, admissionNumber, academicYear);

            // Calculate balance
            Double previousBalance = (totalFees != null ? totalFees : 0) - (totalPaid != null ? totalPaid : 0);

            result.put("totalFees", totalFees != null ? totalFees : 0);
            result.put("totalPaid", totalPaid != null ? totalPaid : 0);
            result.put("previousBalance", Math.max(0, previousBalance));

        } catch (Exception e) {
            log.warn("⚠️ Could not calculate balance for student {}: {}", admissionNumber, e.getMessage());
            result.put("totalFees", 0.0);
            result.put("totalPaid", 0.0);
            result.put("previousBalance", 0.0);
        }
        return result;
    }

    private DailyFeeCollectionDTO aggregateRowsToDTO(List<DailyFeeCollection> rows, Map<String, Object> balanceInfo) {
        if (rows.isEmpty()) return null;

        // Take common details from the first row
        DailyFeeCollection firstRow = rows.get(0);

        DailyFeeCollectionDTO dto = DailyFeeCollectionDTO.builder()
                .billNumber(firstRow.getBillNumber())
                .admissionNumber(firstRow.getAdmissionNumber())
                .studentName(firstRow.getStudentName())
                .fatherName(firstRow.getFatherName())
                .standard(firstRow.getStandard())
                .section(firstRow.getSection())
                .boardingPoint(firstRow.getBoardingPoint())
                .billDate(firstRow.getBillDate())
                .paymentMode(firstRow.getPaymentMode())
                .paymentNumber(firstRow.getPaymentNumber())
                .operatorName(firstRow.getOperatorName())
                .transactionNarrative(firstRow.getTransactionNarrative())
                .transactionDate(firstRow.getTransactionDate())
                .routeNumber(firstRow.getRouteNumber())
                .schoolId(firstRow.getSchoolId())
                .academicYear(firstRow.getAcademicYear())
                .emisNo(firstRow.getEmisNo())
                .aadharNo(firstRow.getAadharNo())
                .build();

        // Calculate totals and build fee payments list
        List<DailyFeeCollectionDTO.FeePaymentDetailDTO> feePayments = new ArrayList<>();
        double totalPaid = 0.0;
        double totalConcession = 0.0;

        for (DailyFeeCollection row : rows) {
            DailyFeeCollectionDTO.FeePaymentDetailDTO paymentDetail = DailyFeeCollectionDTO.FeePaymentDetailDTO.builder()
                    .id(String.valueOf(row.getId()))
                    .feeHeading(row.getFeeHead())
                    .accountHead(row.getAccountHead())
                    .paidAmount(row.getPaidAmount())
                    .concessionAmount(row.getConcessionAmount())
                    .feeAmount((row.getPaidAmount() != null ? row.getPaidAmount() : 0) +
                            (row.getConcessionAmount() != null ? row.getConcessionAmount() : 0))
                    .description(row.getFeeHead())
                    .feeType(getFeeTypeFromHeading(row.getFeeHead()))
                    .status("Paid")
                    .build();

            feePayments.add(paymentDetail);

            if (row.getPaidAmount() != null) totalPaid += row.getPaidAmount();
            if (row.getConcessionAmount() != null) totalConcession += row.getConcessionAmount();
        }

        double previousBalance = (Double) balanceInfo.getOrDefault("previousBalance", 0.0);
        double netPaid = totalPaid + totalConcession;
        double newBalance = Math.max(0, previousBalance - netPaid);

        dto.setFeePayments(feePayments);
        dto.setPaidAmount(totalPaid);
        dto.setConcessionAmount(totalConcession);
        dto.setNetPaidAmount(netPaid);
        dto.setPreviousBalance(previousBalance);
        dto.setNewBalance(newBalance);
        dto.setTotalFeeAmount(netPaid);
        dto.setStatus("Duplicate");

        return dto;
    }

    private String getFeeTypeFromHeading(String feeHeading) {
        if (feeHeading == null) return "Academic";

        String heading = feeHeading.toLowerCase();
        if (heading.contains("tuition") || heading.contains("academic")) {
            return "Academic";
        } else if (heading.contains("hostel")) {
            return "Hostel";
        } else if (heading.contains("transport") || heading.contains("bus")) {
            return "Transport";
        } else {
            return "Miscellaneous";
        }
    }

    private MiscellaneousFeeCollectionResponseDTO convertToMiscellaneousFeeResponseDTO(
            List<MiscellaneousFeeCollection> entries, Map<String, Object> balanceInfo) {

        if (entries.isEmpty()) return null;

        MiscellaneousFeeCollection firstEntry = entries.get(0);

        MiscellaneousFeeCollectionResponseDTO dto = new MiscellaneousFeeCollectionResponseDTO();
        dto.setBillNumber(firstEntry.getBillNumber());
        dto.setAdmissionNumber(firstEntry.getAdmissionNumber());
        dto.setStudentName(firstEntry.getStudentName());
        dto.setFatherName(firstEntry.getFatherName());
        dto.setStandard(firstEntry.getStandard());
        dto.setSection(firstEntry.getSection());
        dto.setBoardingPoint(firstEntry.getBoardingPoint());
        dto.setBillDate(firstEntry.getBillDate());
        dto.setPaymentMode(firstEntry.getPaymentMode());
        dto.setPaymentNumber(firstEntry.getPaymentNumber());
        dto.setOperatorName(firstEntry.getOperatorName());
        dto.setTransactionNarrative(firstEntry.getTransactionNarrative());
        dto.setTransactionDate(firstEntry.getTransactionDate());
        dto.setRouteNumber(firstEntry.getRouteNumber());

        // Calculate totals
        double totalPaid = entries.stream()
                .mapToDouble(e -> e.getPaidAmount() != null ? e.getPaidAmount() : 0.0)
                .sum();
        double totalConcession = entries.stream()
                .mapToDouble(e -> e.getConcessionAmount() != null ? e.getConcessionAmount() : 0.0)
                .sum();
        double totalNetPaid = entries.stream()
                .mapToDouble(e -> e.getNetPaidAmount() != null ? e.getNetPaidAmount() : 0.0)
                .sum();

        double previousBalance = (Double) balanceInfo.getOrDefault("previousBalance", 0.0);
        double newBalance = Math.max(0, previousBalance - totalNetPaid);

        dto.setPaidAmount(totalPaid);
        dto.setConcessionAmount(totalConcession);
        dto.setNetPaidAmount(totalNetPaid);
        dto.setPreviousBalance(previousBalance);
        dto.setNewBalance(newBalance);

        // Build fee details list
        List<MiscellaneousFeeCollectionResponseDTO.FeeDetailDTO> feeDetails = new ArrayList<>();
        for (MiscellaneousFeeCollection entry : entries) {
            MiscellaneousFeeCollectionResponseDTO.FeeDetailDTO feeDetail = new MiscellaneousFeeCollectionResponseDTO.FeeDetailDTO();
            feeDetail.setType("Miscellaneous");
            feeDetail.setFeeHeading(entry.getFeeHead());
            feeDetail.setAccountHead(entry.getAccountHead());
            feeDetail.setFeeAmount((entry.getPaidAmount() != null ? entry.getPaidAmount() : 0) +
                    (entry.getConcessionAmount() != null ? entry.getConcessionAmount() : 0));
            feeDetail.setPaidAmount(entry.getPaidAmount());
            feeDetail.setConcessionAmount(entry.getConcessionAmount());
            feeDetail.setAmount(entry.getNetPaidAmount());
            feeDetail.setDescription(entry.getFeeHead());
            feeDetail.setFeeType("Miscellaneous");
            feeDetail.setIsConcession(entry.getConcessionAmount() != null && entry.getConcessionAmount() > 0);

            feeDetails.add(feeDetail);
        }

        dto.setFeeDetails(feeDetails);

        return dto;
    }

    private static class MiscellaneousFeeCollectionRowMapper implements RowMapper<MiscellaneousFeeCollection> {
        @Override
        public MiscellaneousFeeCollection mapRow(ResultSet rs, int rowNum) throws SQLException {
            return MiscellaneousFeeCollection.builder()
                    .id(rs.getLong("id"))
                    .billNumber(rs.getString("bill_number"))
                    .admissionNumber(rs.getString("admission_number"))
                    .studentName(rs.getString("student_name"))
                    .fatherName(rs.getString("father_name"))
                    .standard(rs.getString("standard"))
                    .section(rs.getString("section"))
                    .emisNo(rs.getString("emis_no"))
                    .aadharNo(rs.getString("aadhar_no"))
                    .boardingPoint(rs.getString("boarding_point"))
                    .billDate(rs.getTimestamp("bill_date") != null ? rs.getTimestamp("bill_date").toLocalDateTime() : null)
                    .feeHead(rs.getString("fee_head"))
                    .accountHead(rs.getString("account_head"))
                    .paidAmount(rs.getDouble("paid_amount"))
                    .concessionAmount(rs.getDouble("concession_amount"))
                    .netPaidAmount(rs.getDouble("net_paid_amount"))
                    .paymentMode(rs.getString("payment_mode"))
                    .paymentNumber(rs.getString("payment_number"))
                    .operatorName(rs.getString("operator_name"))
                    .transactionNarrative(rs.getString("transaction_narrative"))
                    .transactionDate(rs.getTimestamp("transaction_date") != null ? rs.getTimestamp("transaction_date").toLocalDateTime() : null)
                    .routeNumber(rs.getString("route_number"))
                    .schoolId(rs.getString("school_id"))
                    .academicYear(rs.getString("academic_year"))
                    .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
                    .build();
        }
    }

    public boolean healthCheck(String schoolId) {
        try {
            getJdbcTemplate(schoolId).queryForObject("SELECT 1", Integer.class);
            return true;
        } catch (Exception e) {
            log.error("❌ Health check failed for school {}: {}", schoolId, e.getMessage());
            return false;
        }
    }
}