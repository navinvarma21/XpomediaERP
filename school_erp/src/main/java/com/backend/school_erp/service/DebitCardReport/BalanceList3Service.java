package com.backend.school_erp.service.DebitCardReport;

import com.backend.school_erp.DTO.DebitCardReport.BalanceList3DTO;
import com.backend.school_erp.config.DatabaseConfig; // 1. Import AWS Config
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class BalanceList3Service {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    // --- Updated Dynamic AWS DB Connection ---
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

        // 1. Standard Heads (DayFC)
        String[] tables = {"tuition_fees_" + safeYear, "transport_fees_" + safeYear, "hostel_fees_" + safeYear};
        for (String tbl : tables) {
            if (tableExists(jdbc, tbl)) {
                try {
                    dayFC.addAll(jdbc.queryForList("SELECT DISTINCT fee_heading FROM " + tbl, String.class));
                } catch (Exception e) {}
            }
        }

        // 2. Misc/Individual Heads (Miss/Oth)
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

        // Deduplicate and Sort
        result.put("DayFC", dayFC.stream().distinct().sorted().collect(Collectors.toList()));
        result.put("MissOth", missOth.stream().distinct().sorted().collect(Collectors.toList()));

        return result;
    }

    public List<BalanceList3DTO> generateBalanceList3(String schoolId, String academicYear, List<String> feeHeadsFilter, boolean includeMisc) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String safeYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");

        Map<String, ClassData> classMap = new HashMap<>();

        // 1. FETCH FIXED DEMAND (Tuition, Hostel, Transport)
        String[] acadTables = {"tuition_fees_" + safeYear, "hostel_fees_" + safeYear};
        String[] transTables = {"transport_fees_" + safeYear};

        fetchAndAggregateFixed(jdbc, acadTables, feeHeadsFilter, classMap, true);
        fetchAndAggregateFixed(jdbc, transTables, feeHeadsFilter, classMap, false);

        // 2. FETCH INDIVIDUAL FIXED DEMAND (If Misc Included)
        if (includeMisc && tableExists(jdbc, "individual_fees")) {
            String admissionsTable = "admissions_" + safeYear;
            String admissionColumn = getAdmissionColumn(jdbc, admissionsTable);

            String indSql = "SELECT standard, section, fee_head, amount FROM individual_fees " +
                    "JOIN " + admissionsTable + " ON individual_fees.admission_number COLLATE utf8mb4_unicode_ci = " + admissionsTable + "." + admissionColumn + " COLLATE utf8mb4_unicode_ci " +
                    "WHERE individual_fees.academic_year = ?";

            try {
                List<Map<String, Object>> rows = jdbc.queryForList(indSql, academicYear);
                for(Map<String, Object> row : rows) {
                    String head = String.valueOf(row.get("fee_head"));

                    if (feeHeadsFilter == null || feeHeadsFilter.isEmpty() || feeHeadsFilter.contains(head)) {
                        String key = String.valueOf(row.get("standard")) + "-" + String.valueOf(row.get("section"));
                        Object amountObj = row.get("amount");
                        Double amt = amountObj != null ? Double.valueOf(amountObj.toString()) : 0.0;

                        ClassData data = classMap.computeIfAbsent(key, k -> new ClassData(String.valueOf(row.get("standard")), String.valueOf(row.get("section"))));

                        if (head.toLowerCase().contains("transp")) {
                            data.transFixed += amt;
                            data.transFixedMap.merge(head, amt, Double::sum);
                        } else {
                            data.acadFixed += amt;
                            data.acadFixedMap.merge(head, amt, Double::sum);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Error fetching individual fees: " + e.getMessage());
            }
        }

        // 3. FETCH COLLECTIONS (Daily Fee Collection)
        String dailySql = "SELECT standard, section, fee_head, SUM(paid_amount) as paid, SUM(concession_amount) as conc " +
                "FROM daily_fee_collection WHERE school_id = ? AND academic_year = ?";

        if (feeHeadsFilter != null && !feeHeadsFilter.isEmpty()) {
            dailySql += " AND fee_head IN (" + buildInClause(feeHeadsFilter) + ")";
        }
        dailySql += " GROUP BY standard, section, fee_head";

        jdbc.query(dailySql, rs -> {
            try {
                processCollectionRow(rs, classMap, transTables, jdbc);
            } catch (SQLException e) {
                throw new RuntimeException("Error processing daily fee row", e);
            }
        }, schoolId, academicYear);

        // 4. FETCH MISCELLANEOUS COLLECTIONS
        if (includeMisc) {
            String miscSql = "SELECT standard, section, fee_head, SUM(paid_amount) as paid, SUM(concession_amount) as conc " +
                    "FROM miscellaneous_fee_collection WHERE school_id = ? AND academic_year = ?";

            if (feeHeadsFilter != null && !feeHeadsFilter.isEmpty()) {
                miscSql += " AND fee_head IN (" + buildInClause(feeHeadsFilter) + ")";
            }
            miscSql += " GROUP BY standard, section, fee_head";

            jdbc.query(miscSql, rs -> {
                try {
                    processCollectionRow(rs, classMap, transTables, jdbc);
                } catch (SQLException e) {
                    throw new RuntimeException(e);
                }
            }, schoolId, academicYear);
        }

        // 5. CONVERT TO DTO
        List<BalanceList3DTO> results = new ArrayList<>();
        for (ClassData d : classMap.values()) {
            BalanceList3DTO dto = new BalanceList3DTO();
            dto.setStandard(d.std);
            dto.setSection(d.sec);

            dto.setAcademicFixed(d.acadFixed);
            dto.setAcademicPaid(d.acadPaid);
            double acadConcTotal = d.acadConcessionMap.values().stream().mapToDouble(Double::doubleValue).sum();
            dto.setAcademicBalance(Math.max(0, d.acadFixed - (d.acadPaid + acadConcTotal)));
            dto.setAcademicFixedDetails(formatMap(d.acadFixedMap));
            dto.setAcademicPaidDetails(formatMap(d.acadPaidMap));
            dto.setAcademicBalanceDetails(calculateDetailedBalance(d.acadFixedMap, d.acadPaidMap, d.acadConcessionMap));

            dto.setTransportFixed(d.transFixed);
            dto.setTransportPaid(d.transPaid);
            double transConcTotal = d.transConcessionMap.values().stream().mapToDouble(Double::doubleValue).sum();
            dto.setTransportBalance(Math.max(0, d.transFixed - (d.transPaid + transConcTotal)));
            dto.setTransportFixedDetails(formatMap(d.transFixedMap));
            dto.setTransportPaidDetails(formatMap(d.transPaidMap));
            dto.setTransportBalanceDetails(calculateDetailedBalance(d.transFixedMap, d.transPaidMap, d.transConcessionMap));

            dto.setConcession(d.concession);
            dto.setConcessionDetails(formatMap(d.concessionMap));
            dto.setTotalFixed(d.acadFixed + d.transFixed);
            dto.setActualPaid(d.acadPaid + d.transPaid);
            dto.setTotalPaid(dto.getActualPaid() + d.concession);
            dto.setTotalBalance(Math.max(0, dto.getTotalFixed() - dto.getTotalPaid()));

            results.add(dto);
        }

        results.sort(Comparator.comparing(BalanceList3DTO::getStandard).thenComparing(BalanceList3DTO::getSection));
        return results;
    }

    private void processCollectionRow(java.sql.ResultSet rs, Map<String, ClassData> classMap, String[] transTables, JdbcTemplate jdbc) throws SQLException {
        String key = rs.getString("standard") + "-" + rs.getString("section");
        String head = rs.getString("fee_head");
        Double paid = rs.getDouble("paid");
        Double conc = rs.getDouble("conc");
        double virtualFixed = paid + conc;

        ClassData data = classMap.computeIfAbsent(key, k -> {
            try {
                return new ClassData(rs.getString("standard"), rs.getString("section"));
            } catch (SQLException e) {
                throw new RuntimeException(e);
            }
        });

        if (conc > 0) {
            data.concession += conc;
            data.concessionMap.merge(head, conc, Double::sum);
        }

        boolean isTransport = (head != null && head.toLowerCase().contains("transp")) || checkTableForHead(jdbc, transTables, head);

        if (isTransport) {
            data.transPaid += paid;
            data.transPaidMap.merge(head, paid, Double::sum);
            if (conc > 0) data.transConcessionMap.merge(head, conc, Double::sum);
            if (!data.transFixedMap.containsKey(head)) {
                data.transFixed += virtualFixed;
                data.transFixedMap.merge(head, virtualFixed, Double::sum);
            }
        } else {
            data.acadPaid += paid;
            data.acadPaidMap.merge(head, paid, Double::sum);
            if (conc > 0) data.acadConcessionMap.merge(head, conc, Double::sum);
            if (!data.acadFixedMap.containsKey(head)) {
                data.acadFixed += virtualFixed;
                data.acadFixedMap.merge(head, virtualFixed, Double::sum);
            }
        }
    }

    private void fetchAndAggregateFixed(JdbcTemplate jdbc, String[] tables, List<String> feeHeadsFilter, Map<String, ClassData> map, boolean isAcad) {
        for (String tbl : tables) {
            if (!tableExists(jdbc, tbl)) continue;
            String sql = "SELECT standard, section, fee_heading, SUM(amount) as amt FROM " + tbl;
            if (feeHeadsFilter != null && !feeHeadsFilter.isEmpty()) {
                sql += " WHERE fee_heading IN (" + buildInClause(feeHeadsFilter) + ")";
            }
            sql += " GROUP BY standard, section, fee_heading";

            jdbc.query(sql, rs -> {
                try {
                    String key = rs.getString("standard") + "-" + rs.getString("section");
                    Double amt = rs.getDouble("amt");
                    String head = rs.getString("fee_heading");

                    ClassData d = map.computeIfAbsent(key, k -> {
                        try {
                            return new ClassData(rs.getString("standard"), rs.getString("section"));
                        } catch (SQLException e) {
                            throw new RuntimeException(e);
                        }
                    });

                    if (isAcad) {
                        d.acadFixed += amt;
                        d.acadFixedMap.merge(head, amt, Double::sum);
                    } else {
                        d.transFixed += amt;
                        d.transFixedMap.merge(head, amt, Double::sum);
                    }
                } catch (SQLException e) {
                    throw new RuntimeException("Error fetching fixed fee data", e);
                }
            });
        }
    }

    private String buildInClause(List<String> heads) {
        return "'" + String.join("','", heads) + "'";
    }

    private String getAdmissionColumn(JdbcTemplate jdbc, String tableName) {
        try {
            jdbc.queryForObject("SELECT admission_no FROM " + tableName + " LIMIT 1", Object.class);
            return "admission_no";
        } catch (Exception e) {
            return "admission_number";
        }
    }

    private String formatMap(Map<String, Double> map) {
        return map.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .map(e -> e.getKey() + ": " + String.format("%.0f", e.getValue()))
                .collect(Collectors.joining(", "));
    }

    private String calculateDetailedBalance(Map<String, Double> fixed, Map<String, Double> paid, Map<String, Double> conc) {
        Map<String, Double> balMap = new HashMap<>(fixed);
        paid.forEach((k, v) -> { if (balMap.containsKey(k)) balMap.merge(k, -v, Double::sum); });
        conc.forEach((k, v) -> { if (balMap.containsKey(k)) balMap.merge(k, -v, Double::sum); });
        return balMap.entrySet().stream()
                .filter(e -> e.getValue() > 1)
                .map(e -> e.getKey() + ": " + String.format("%.0f", e.getValue()))
                .collect(Collectors.joining(", "));
    }

    private boolean checkTableForHead(JdbcTemplate jdbc, String[] tables, String head) {
        return head != null && head.toLowerCase().contains("transp");
    }

    private boolean tableExists(JdbcTemplate jdbc, String tableName) {
        try {
            jdbc.queryForObject("SELECT 1 FROM " + tableName + " LIMIT 1", Integer.class);
            return true;
        } catch (Exception e) { return false; }
    }

    private static class ClassData {
        String std, sec;
        double acadFixed = 0, acadPaid = 0;
        double transFixed = 0, transPaid = 0;
        double concession = 0;
        Map<String, Double> acadFixedMap = new HashMap<>();
        Map<String, Double> acadPaidMap = new HashMap<>();
        Map<String, Double> transFixedMap = new HashMap<>();
        Map<String, Double> transPaidMap = new HashMap<>();
        Map<String, Double> acadConcessionMap = new HashMap<>();
        Map<String, Double> transConcessionMap = new HashMap<>();
        Map<String, Double> concessionMap = new HashMap<>();

        public ClassData(String std, String sec) { this.std = std; this.sec = sec; }
    }
}