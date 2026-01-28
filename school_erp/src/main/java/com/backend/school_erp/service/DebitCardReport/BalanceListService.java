package com.backend.school_erp.service.DebitCardReport;

import com.backend.school_erp.DTO.DebitCardReport.BalanceList2DTO;
import com.backend.school_erp.DTO.DebitCardReport.BalanceListDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;


import javax.sql.DataSource;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BalanceListService {

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

    // Helper: Get distinct fee headings from a table
    private Set<String> getDistinctFeeHeads(JdbcTemplate jdbc, String tableName) {
        Set<String> heads = new HashSet<>();
        if (tableExists(jdbc, tableName)) {
            try {
                jdbc.query("SELECT DISTINCT fee_heading FROM " + tableName, rs -> {
                    heads.add(rs.getString("fee_heading"));
                });
            } catch (Exception e) {
                // ignore
            }
        }
        return heads;
    }

    // New Method: Fetch Distinct Fee Heads for Dropdown
    public List<String> getFeeHeads(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String safeYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        Set<String> heads = new HashSet<>();

        heads.addAll(getDistinctFeeHeads(jdbc, "tuition_fees_" + safeYear));
        heads.addAll(getDistinctFeeHeads(jdbc, "hostel_fees_" + safeYear));
        heads.addAll(getDistinctFeeHeads(jdbc, "transport_fees_" + safeYear));

        List<String> sortedHeads = new ArrayList<>(heads);
        Collections.sort(sortedHeads);
        return sortedHeads;
    }

    // --- REPORT 1: SUMMARY (Class Wise) ---
    public List<BalanceListDTO> generateBalanceList1(String schoolId, String academicYear, String feeHeadFilter) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String safeYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");

        Map<String, BalanceListDTO> reportMap = new HashMap<>();

        // 1. ACADEMIC Demand (Tuition + Hostel)
        String[] acadTables = {"tuition_fees_" + safeYear, "hostel_fees_" + safeYear};
        for (String table : acadTables) {
            if (tableExists(jdbc, table)) {
                try {
                    String sql = "SELECT standard, section, SUM(amount) as total FROM " + table;
                    List<Object> params = new ArrayList<>();

                    if (feeHeadFilter != null && !feeHeadFilter.isEmpty()) {
                        sql += " WHERE fee_heading = ?";
                        params.add(feeHeadFilter);
                    }

                    sql += " GROUP BY standard, section";

                    jdbc.query(sql, rs -> {
                        String key = rs.getString("standard") + "-" + rs.getString("section");
                        BalanceListDTO dto = reportMap.getOrDefault(key, new BalanceListDTO(
                                rs.getString("standard"), rs.getString("section"), 0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0
                        ));
                        dto.setAcademicFixed(dto.getAcademicFixed() + rs.getDouble("total"));
                        reportMap.put(key, dto);
                    }, params.toArray());
                } catch (Exception e) {}
            }
        }

        // 2. TRANSPORT Demand
        String[] transTables = {"transport_fees_" + safeYear};
        for (String table : transTables) {
            if (tableExists(jdbc, table)) {
                try {
                    String sql = "SELECT standard, section, SUM(amount) as total FROM " + table;
                    List<Object> params = new ArrayList<>();

                    if (feeHeadFilter != null && !feeHeadFilter.isEmpty()) {
                        sql += " WHERE fee_heading = ?";
                        params.add(feeHeadFilter);
                    }

                    sql += " GROUP BY standard, section";

                    jdbc.query(sql, rs -> {
                        String key = rs.getString("standard") + "-" + rs.getString("section");
                        BalanceListDTO dto = reportMap.getOrDefault(key, new BalanceListDTO(
                                rs.getString("standard"), rs.getString("section"), 0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0
                        ));
                        dto.setTransportFixed(dto.getTransportFixed() + rs.getDouble("total"));
                        reportMap.put(key, dto);
                    }, params.toArray());
                } catch (Exception e) {}
            }
        }

        // 3. PAYMENTS
        StringBuilder paymentSql = new StringBuilder("""
            SELECT 
                standard, 
                section,
                fee_head,
                SUM(paid_amount) as paid_amt,
                SUM(concession_amount) as concession_amt
            FROM daily_fee_collection 
            WHERE school_id = ? AND academic_year = ?
        """);

        List<Object> params = new ArrayList<>();
        params.add(schoolId);
        params.add(academicYear);

        if (feeHeadFilter != null && !feeHeadFilter.isEmpty()) {
            paymentSql.append(" AND fee_head = ?");
            params.add(feeHeadFilter);
        }

        paymentSql.append(" GROUP BY standard, section, fee_head");

        // Helper sets to categorize if not filtered
        Set<String> academicFeeHeads = new HashSet<>();
        academicFeeHeads.addAll(getDistinctFeeHeads(jdbc, "tuition_fees_" + safeYear));
        academicFeeHeads.addAll(getDistinctFeeHeads(jdbc, "hostel_fees_" + safeYear));

        Set<String> transportFeeHeads = new HashSet<>();
        transportFeeHeads.addAll(getDistinctFeeHeads(jdbc, "transport_fees_" + safeYear));

        jdbc.query(paymentSql.toString(), rs -> {
            String std = rs.getString("standard");
            String sec = rs.getString("section");
            String feeHead = rs.getString("fee_head");
            Double paid = rs.getDouble("paid_amt");
            Double conc = rs.getDouble("concession_amt");

            String key = std + "-" + sec;
            BalanceListDTO dto = reportMap.getOrDefault(key, new BalanceListDTO(
                    std, sec, 0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0
            ));

            if (academicFeeHeads.contains(feeHead)) {
                dto.setAcademicPaid(dto.getAcademicPaid() + paid);
            } else if (transportFeeHeads.contains(feeHead)) {
                dto.setTransportPaid(dto.getTransportPaid() + paid);
            } else {
                if (feeHead.toLowerCase().contains("transport")) {
                    dto.setTransportPaid(dto.getTransportPaid() + paid);
                } else {
                    dto.setAcademicPaid(dto.getAcademicPaid() + paid);
                }
            }

            dto.setConcession(dto.getConcession() + conc);
            reportMap.put(key, dto);
        }, params.toArray());

        // Summarize
        List<BalanceListDTO> finalReport = new ArrayList<>(reportMap.values());
        for (BalanceListDTO dto : finalReport) {
            dto.setAcademicBalance(Math.max(0, dto.getAcademicFixed() - dto.getAcademicPaid()));
            dto.setTransportBalance(Math.max(0, dto.getTransportFixed() - dto.getTransportPaid()));
            dto.setTotalFixed(dto.getAcademicFixed() + dto.getTransportFixed());
            dto.setActualPaid(dto.getAcademicPaid() + dto.getTransportPaid());
            dto.setTotalPaid(dto.getActualPaid() + dto.getConcession());
            dto.setTotalBalance(dto.getTotalFixed() - dto.getTotalPaid());
        }

        finalReport.sort((a, b) -> {
            int stdCompare = a.getStandard().compareTo(b.getStandard());
            if (stdCompare != 0) return stdCompare;
            return a.getSection().compareTo(b.getSection());
        });

        return finalReport;
    }

    // --- REPORT 2: DETAILED (Student Wise) ---
    public List<BalanceList2DTO> generateBalanceList2(String schoolId, String academicYear, String feeHeadFilter) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String safeYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");

        List<BalanceList2DTO> reportList = new ArrayList<>();

        String studentTable = "admissions_" + safeYear;
        if (!tableExists(jdbc, studentTable)) return reportList;

        String studentSql = "SELECT admission_no as admission_number, student_name, father_name, standard, section, boarding_point FROM " + studentTable + " ORDER BY standard, section, student_name";
        List<Map<String, Object>> students;
        try {
            students = jdbc.queryForList(studentSql);
        } catch (Exception e) {
            // Fallback
            students = jdbc.queryForList("SELECT admission_number, student_name, father_name, standard, section, boarding_point FROM " + studentTable + " ORDER BY standard, section, student_name");
        }

        // Fetch Demands with Filter
        Map<String, Double> academicDemandMap = new HashMap<>();
        Map<String, Double> transportDemandMap = new HashMap<>();

        String[] acadTables = {"tuition_fees_" + safeYear, "hostel_fees_" + safeYear};
        for (String table : acadTables) {
            if (tableExists(jdbc, table)) {
                try {
                    String sql = "SELECT admission_number, SUM(amount) as total FROM " + table;
                    List<Object> params = new ArrayList<>();
                    if (feeHeadFilter != null && !feeHeadFilter.isEmpty()) {
                        sql += " WHERE fee_heading = ?";
                        params.add(feeHeadFilter);
                    }
                    sql += " GROUP BY admission_number";

                    jdbc.query(sql, rs -> {
                        academicDemandMap.merge(rs.getString("admission_number"), rs.getDouble("total"), Double::sum);
                    }, params.toArray());
                } catch (Exception e) {
                    // Try fallback column name
                    try {
                        String sql = "SELECT admission_no, SUM(amount) as total FROM " + table;
                        List<Object> params = new ArrayList<>();
                        if (feeHeadFilter != null && !feeHeadFilter.isEmpty()) {
                            sql += " WHERE fee_heading = ?";
                            params.add(feeHeadFilter);
                        }
                        sql += " GROUP BY admission_no";
                        jdbc.query(sql, rs -> {
                            academicDemandMap.merge(rs.getString("admission_no"), rs.getDouble("total"), Double::sum);
                        }, params.toArray());
                    } catch(Exception ex) {}
                }
            }
        }

        String[] transTables = {"transport_fees_" + safeYear};
        for (String table : transTables) {
            if (tableExists(jdbc, table)) {
                try {
                    String sql = "SELECT admission_number, SUM(amount) as total FROM " + table;
                    List<Object> params = new ArrayList<>();
                    if (feeHeadFilter != null && !feeHeadFilter.isEmpty()) {
                        sql += " WHERE fee_heading = ?";
                        params.add(feeHeadFilter);
                    }
                    sql += " GROUP BY admission_number";
                    jdbc.query(sql, rs -> {
                        transportDemandMap.merge(rs.getString("admission_number"), rs.getDouble("total"), Double::sum);
                    }, params.toArray());
                } catch (Exception e) {
                    try {
                        String sql = "SELECT admission_no, SUM(amount) as total FROM " + table;
                        List<Object> params = new ArrayList<>();
                        if (feeHeadFilter != null && !feeHeadFilter.isEmpty()) {
                            sql += " WHERE fee_heading = ?";
                            params.add(feeHeadFilter);
                        }
                        sql += " GROUP BY admission_no";
                        jdbc.query(sql, rs -> {
                            transportDemandMap.merge(rs.getString("admission_no"), rs.getDouble("total"), Double::sum);
                        }, params.toArray());
                    } catch(Exception ex) {}
                }
            }
        }

        // Fetch Payments with Filter
        StringBuilder paymentSql = new StringBuilder("""
            SELECT 
                admission_number, 
                fee_head,
                SUM(paid_amount) as paid, 
                SUM(concession_amount) as conc,
                MAX(transaction_narrative) as narrative
            FROM daily_fee_collection 
            WHERE school_id = ? AND academic_year = ?
        """);

        List<Object> params = new ArrayList<>();
        params.add(schoolId);
        params.add(academicYear);

        if (feeHeadFilter != null && !feeHeadFilter.isEmpty()) {
            paymentSql.append(" AND fee_head = ?");
            params.add(feeHeadFilter);
        }

        paymentSql.append(" GROUP BY admission_number, fee_head");

        Map<String, PaymentData> paymentMap = new HashMap<>();

        Set<String> academicFeeHeads = new HashSet<>();
        academicFeeHeads.addAll(getDistinctFeeHeads(jdbc, "tuition_fees_" + safeYear));
        academicFeeHeads.addAll(getDistinctFeeHeads(jdbc, "hostel_fees_" + safeYear));
        Set<String> transportFeeHeads = new HashSet<>();
        transportFeeHeads.addAll(getDistinctFeeHeads(jdbc, "transport_fees_" + safeYear));

        jdbc.query(paymentSql.toString(), rs -> {
            String admNo = rs.getString("admission_number");
            String feeHead = rs.getString("fee_head");
            Double paid = rs.getDouble("paid");
            Double conc = rs.getDouble("conc");
            String narr = rs.getString("narrative");

            PaymentData data = paymentMap.getOrDefault(admNo, new PaymentData());

            if (academicFeeHeads.contains(feeHead)) {
                data.acadPaid += paid;
            } else if (transportFeeHeads.contains(feeHead)) {
                data.transPaid += paid;
            } else {
                if (feeHead != null && feeHead.toLowerCase().contains("transport")) {
                    data.transPaid += paid;
                } else {
                    data.acadPaid += paid;
                }
            }

            data.totalConc += conc;
            if (narr != null && !narr.isEmpty()) data.narrative = narr;

            paymentMap.put(admNo, data);
        }, params.toArray());

        for (Map<String, Object> s : students) {
            String admNo = (String) s.get("admission_number");

            Double acadFix = academicDemandMap.getOrDefault(admNo, 0.0);
            Double transFix = transportDemandMap.getOrDefault(admNo, 0.0);

            // Important: Only add to report if there is demand OR payment (skip empty rows if filtered)
            if (feeHeadFilter != null && !feeHeadFilter.isEmpty()) {
                PaymentData pd = paymentMap.get(admNo);
                boolean hasPayment = (pd != null && (pd.acadPaid > 0 || pd.transPaid > 0));
                if (acadFix == 0 && transFix == 0 && !hasPayment) {
                    continue;
                }
            }

            PaymentData pData = paymentMap.getOrDefault(admNo, new PaymentData());

            BalanceList2DTO dto = new BalanceList2DTO();
            dto.setAdmissionNumber(admNo);
            dto.setStudentName((String) s.get("student_name"));
            dto.setFatherName((String) s.get("father_name"));
            dto.setGrade(s.get("standard") + " " + s.get("section"));
            dto.setBoardingPoint((String) s.get("boarding_point"));

            dto.setAcademicFixed(acadFix);
            dto.setAcademicPaid(pData.acadPaid);
            dto.setAcademicBalance(Math.max(0, acadFix - pData.acadPaid));

            dto.setTransportFixed(transFix);
            dto.setTransportPaid(pData.transPaid);
            dto.setTransportBalance(Math.max(0, transFix - pData.transPaid));

            dto.setConcession(pData.totalConc);
            dto.setNarrative(pData.narrative != null ? pData.narrative : "");

            dto.setTotalFixed(acadFix + transFix);
            dto.setActualPaid(pData.acadPaid + pData.transPaid);
            dto.setTotalPaid(dto.getActualPaid() + dto.getConcession());
            dto.setTotalBalance(Math.max(0, dto.getTotalFixed() - dto.getTotalPaid()));

            reportList.add(dto);
        }

        return reportList;
    }

    private boolean tableExists(JdbcTemplate jdbc, String tableName) {
        try {
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
                    Integer.class, tableName);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private static class PaymentData {
        double acadPaid = 0;
        double transPaid = 0;
        double totalConc = 0;
        String narrative = "";
    }
}