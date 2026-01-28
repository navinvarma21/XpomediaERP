package com.backend.school_erp.service.DebitCardReport;

import com.backend.school_erp.DTO.DebitCardReport.BalanceList4DTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class BalanceList4Service {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        DataSource ds = dataSourceCache.computeIfAbsent(schoolId, id -> {
            HikariConfig config = new HikariConfig();

            // 2. Use AWS DB Constants from DatabaseConfig
            // Appends the schoolId as the specific database name
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName(DatabaseConfig.JDBC_DRIVER);

            // Pool performance settings for complex report generation
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);
            config.setMaxLifetime(1800000);
            config.setConnectionTimeout(10000);

            return new HikariDataSource(config);
        });
        return new JdbcTemplate(ds);
    }

    // --- Fetch Grouped Fee Heads ---
    public Map<String, List<String>> getGroupedFeeHeads(String schoolId, String academicYear, boolean includeMisc) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String safeYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        Map<String, List<String>> result = new HashMap<>();
        List<String> dayFC = new ArrayList<>();
        List<String> missOth = new ArrayList<>();

        String[] tables = {"tuition_fees_" + safeYear, "transport_fees_" + safeYear, "hostel_fees_" + safeYear};
        for (String tbl : tables) {
            if (tableExists(jdbc, tbl)) {
                try {
                    dayFC.addAll(jdbc.queryForList("SELECT DISTINCT fee_heading FROM " + tbl, String.class));
                } catch (Exception e) {}
            }
        }

        if (includeMisc) {
            if (tableExists(jdbc, "individual_fees")) {
                try {
                    missOth.addAll(jdbc.queryForList("SELECT DISTINCT fee_head FROM individual_fees WHERE academic_year = ?", String.class, academicYear));
                } catch (Exception e) {}
            }
            if (tableExists(jdbc, "miscellaneous_fee_collection")) {
                try {
                    missOth.addAll(jdbc.queryForList("SELECT DISTINCT fee_head FROM miscellaneous_fee_collection WHERE academic_year = ?", String.class, academicYear));
                } catch (Exception e) {}
            }
        }

        result.put("DayFC", dayFC.stream().distinct().sorted().collect(Collectors.toList()));
        result.put("MissOth", missOth.stream().distinct().sorted().collect(Collectors.toList()));
        return result;
    }

    public List<BalanceList4DTO> generateBalanceList4(String schoolId, String academicYear,
                                                      List<String> feeHeadsFilter, boolean includeMisc) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String safeYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        Map<String, StudentData> studentMap = new HashMap<>();

        // 1. FETCH STUDENTS
        String studentTable = "admissions_" + safeYear;
        if (!tableExists(jdbc, studentTable)) return Collections.emptyList();

        String studentSql = "SELECT admission_number, student_name, father_name, standard, section, boarding_point " +
                "FROM " + studentTable + " " +
                "ORDER BY standard, section, student_name";

        jdbc.query(studentSql, rs -> {
            String admNo = rs.getString("admission_number");
            StudentData data = new StudentData();
            data.admissionNo = admNo;
            data.studentName = rs.getString("student_name");
            data.fatherName = rs.getString("father_name");
            data.standard = rs.getString("standard");
            data.section = rs.getString("section");
            data.boardingPoint = rs.getString("boarding_point");
            studentMap.put(admNo, data);
        });

        // 2. FETCH FIXED DEMAND (Tuition, Hostel, Transport, Individual)
        fetchFixedDemands(jdbc, safeYear, feeHeadsFilter, studentMap, includeMisc);

        // 3. FETCH COLLECTIONS (Daily & Misc)
        // This is where the logic to add Virtual Fixed amounts for Spot Fees resides
        fetchCollections(jdbc, schoolId, academicYear, feeHeadsFilter, studentMap, "daily_fee_collection");

        if (includeMisc) {
            fetchCollections(jdbc, schoolId, academicYear, feeHeadsFilter, studentMap, "miscellaneous_fee_collection");
        }

        // 4. CONVERT TO DTO
        List<BalanceList4DTO> results = new ArrayList<>();
        for (StudentData data : studentMap.values()) {
            double totalConc = data.acadConc + data.transConc;

            if (data.acadFixed == 0 && data.acadPaid == 0 && data.transFixed == 0 && data.transPaid == 0 && totalConc == 0) continue;

            // Updated Calculation: Balance = Fixed - (Paid + Concession)
            double acadBalance = Math.max(0, data.acadFixed - (data.acadPaid + data.acadConc));
            double transBalance = Math.max(0, data.transFixed - (data.transPaid + data.transConc));

            double totalFixed = data.acadFixed + data.transFixed;
            double actualPaid = data.acadPaid + data.transPaid;
            double totalPaid = actualPaid + totalConc;
            double totalBalance = Math.max(0, totalFixed - totalPaid);

            BalanceList4DTO dto = BalanceList4DTO.builder()
                    .admissionNumber(data.admissionNo)
                    .studentName(data.studentName)
                    .fatherName(data.fatherName)
                    .grade((data.standard != null ? data.standard : "") + " " + (data.section != null ? data.section : ""))
                    .standard(data.standard)
                    .section(data.section)
                    .boardingPoint(data.boardingPoint)

                    .academicFixed(data.acadFixed)
                    .academicFixedDetails(data.acadFixedDetails.toString())
                    .academicPaid(data.acadPaid)
                    .academicPaidDetails(data.acadPaidDetails.toString())
                    .academicBalance(acadBalance)

                    .transportFixed(data.transFixed)
                    .transportFixedDetails(data.transFixedDetails.toString())
                    .transportPaid(data.transPaid)
                    .transportPaidDetails(data.transPaidDetails.toString())
                    .transportBalance(transBalance)

                    .concession(totalConc)
                    .concessionDetails(data.concessionDetails.toString())
                    .narrative(data.narrative)

                    .totalFixed(totalFixed)
                    .actualPaid(actualPaid)
                    .totalPaid(totalPaid)
                    .totalBalance(totalBalance)
                    .build();

            results.add(dto);
        }

        results.sort(Comparator.comparing(BalanceList4DTO::getStandard, Comparator.nullsLast(String::compareTo))
                .thenComparing(BalanceList4DTO::getSection, Comparator.nullsLast(String::compareTo))
                .thenComparing(BalanceList4DTO::getStudentName, Comparator.nullsLast(String::compareTo)));

        return results;
    }

    // --- Helpers ---

    private void fetchFixedDemands(JdbcTemplate jdbc, String safeYear, List<String> feeHeadsFilter,
                                   Map<String, StudentData> studentMap, boolean includeMisc) {
        String tuitionTable = "tuition_fees_" + safeYear;
        if (tableExists(jdbc, tuitionTable)) fetchFromFixedTable(jdbc, tuitionTable, "admission_number", "fee_heading", feeHeadsFilter, studentMap, true);

        String hostelTable = "hostel_fees_" + safeYear;
        if (tableExists(jdbc, hostelTable)) fetchFromFixedTable(jdbc, hostelTable, "admission_number", "fee_heading", feeHeadsFilter, studentMap, true);

        String transportTable = "transport_fees_" + safeYear;
        if (tableExists(jdbc, transportTable)) fetchFromFixedTable(jdbc, transportTable, "admission_number", "fee_heading", feeHeadsFilter, studentMap, false);

        if (includeMisc && tableExists(jdbc, "individual_fees")) {
            String indSql = "SELECT admission_number, fee_head, amount FROM individual_fees WHERE academic_year = ?";
            if (feeHeadsFilter != null && !feeHeadsFilter.isEmpty()) indSql += " AND fee_head IN (" + buildInClause(feeHeadsFilter) + ")";
            try {
                jdbc.query(indSql, rs -> {
                    String admNo = rs.getString("admission_number");
                    StudentData data = studentMap.get(admNo);
                    if (data != null) {
                        double amt = rs.getDouble("amount");
                        String head = rs.getString("fee_head");

                        // TRACKING: This head has a real fixed amount
                        data.existingFixedHeads.add(head);

                        data.acadFixed += amt;
                        data.acadFixedDetails.append(head).append(": ").append(amt).append("\n");
                    }
                }, safeYear.replace("_", "-"));
            } catch (Exception e) {}
        }
    }

    private void fetchFromFixedTable(JdbcTemplate jdbc, String table, String admCol, String headCol,
                                     List<String> feeHeadsFilter, Map<String, StudentData> studentMap, boolean isAcademic) {
        String sql = "SELECT " + admCol + ", " + headCol + ", amount FROM " + table;
        if (feeHeadsFilter != null && !feeHeadsFilter.isEmpty()) sql += " WHERE " + headCol + " IN (" + buildInClause(feeHeadsFilter) + ")";

        try {
            jdbc.query(sql, rs -> {
                String admNo = rs.getString(admCol);
                StudentData data = studentMap.get(admNo);
                if (data != null) {
                    double amt = rs.getDouble("amount");
                    String head = rs.getString(headCol);

                    // TRACKING: This head has a real fixed amount
                    data.existingFixedHeads.add(head);

                    if (isAcademic) {
                        data.acadFixed += amt;
                        data.acadFixedDetails.append(head).append(": ").append(amt).append("\n");
                    } else {
                        data.transFixed += amt;
                        data.transFixedDetails.append(head).append(": ").append(amt).append("\n");
                    }
                }
            });
        } catch (Exception e) {}
    }

    private void fetchCollections(JdbcTemplate jdbc, String schoolId, String academicYear,
                                  List<String> feeHeadsFilter, Map<String, StudentData> studentMap, String collectionTable) {
        if (!tableExists(jdbc, collectionTable)) return;

        // Group by fee_head to align payments with fixed heads
        String sql = "SELECT admission_number, fee_head, SUM(paid_amount) as paid, SUM(concession_amount) as conc, MAX(transaction_narrative) as narr " +
                "FROM " + collectionTable + " WHERE school_id = ? AND academic_year = ?";

        if (feeHeadsFilter != null && !feeHeadsFilter.isEmpty()) sql += " AND fee_head IN (" + buildInClause(feeHeadsFilter) + ")";
        sql += " GROUP BY admission_number, fee_head";

        try {
            jdbc.query(sql, rs -> {
                String admNo = rs.getString("admission_number");
                String head = rs.getString("fee_head");
                Double paid = rs.getDouble("paid");
                Double conc = rs.getDouble("conc");
                String narr = rs.getString("narr");

                StudentData data = studentMap.get(admNo);
                if (data == null) return;

                if (narr != null && !narr.isEmpty()) data.narrative = narr;

                // 2. Calculate Virtual Fixed Amount (Spot Fee Logic)
                double virtualDemand = paid + conc;

                // FIX: Use "transp" to catch variations like "Transprt"
                boolean isTransport = head != null && head.toLowerCase().contains("transp");

                // 3. Process Payments & Apply Virtual Fixed if needed
                if (isTransport) {
                    // Update Transport Concession
                    if (conc > 0) {
                        data.transConc += conc;
                        data.concessionDetails.append(head).append(": ").append(conc).append("\n");
                    }

                    if (paid > 0) {
                        data.transPaid += paid;
                        data.transPaidDetails.append(head).append(": ").append(paid).append("\n");
                    }

                    // IF SPOT FEE (Head was not in Fixed Table), Add Virtual Demand
                    if (!data.existingFixedHeads.contains(head)) {
                        data.transFixed += virtualDemand;
                        data.transFixedDetails.append(head).append(": ").append(virtualDemand).append("\n");
                        data.existingFixedHeads.add(head); // Prevent double counting
                    }

                } else {
                    // Update Academic Concession
                    if (conc > 0) {
                        data.acadConc += conc;
                        data.concessionDetails.append(head).append(": ").append(conc).append("\n");
                    }

                    if (paid > 0) {
                        data.acadPaid += paid;
                        data.acadPaidDetails.append(head).append(": ").append(paid).append("\n");
                    }

                    // IF SPOT FEE (Head was not in Fixed Table), Add Virtual Demand
                    if (!data.existingFixedHeads.contains(head)) {
                        data.acadFixed += virtualDemand;
                        data.acadFixedDetails.append(head).append(": ").append(virtualDemand).append("\n");
                        data.existingFixedHeads.add(head); // Prevent double counting
                    }
                }
            }, schoolId, academicYear);
        } catch (Exception e) {}
    }

    private String buildInClause(List<String> heads) {
        return heads.stream().map(head -> "'" + head.replace("'", "''") + "'").collect(Collectors.joining(","));
    }

    private boolean tableExists(JdbcTemplate jdbc, String tableName) {
        try {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", Integer.class, tableName);
            return count != null && count > 0;
        } catch (Exception e) { return false; }
    }

    private static class StudentData {
        String admissionNo = "";
        String studentName = "";
        String fatherName = "";
        String standard = "";
        String section = "";
        String boardingPoint = "";
        String narrative = "";

        double acadFixed = 0;
        double acadPaid = 0;
        double acadConc = 0; // Added for separated balance calculation

        double transFixed = 0;
        double transPaid = 0;
        double transConc = 0; // Added for separated balance calculation

        StringBuilder acadFixedDetails = new StringBuilder();
        StringBuilder acadPaidDetails = new StringBuilder();
        StringBuilder transFixedDetails = new StringBuilder();
        StringBuilder transPaidDetails = new StringBuilder();
        StringBuilder concessionDetails = new StringBuilder();

        // New Set to track which heads came from Fixed Tables
        Set<String> existingFixedHeads = new HashSet<>();
    }
}