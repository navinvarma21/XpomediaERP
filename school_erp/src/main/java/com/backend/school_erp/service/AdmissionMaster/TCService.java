package com.backend.school_erp.service.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.ArrearFeeDTO;
import com.backend.school_erp.DTO.AdmissionMaster.StudentTCProfileDTO;
import com.backend.school_erp.DTO.AdmissionMaster.TCRequestDTO;
import com.backend.school_erp.DTO.DebitCardReport.TCListResponseDTO;
import com.backend.school_erp.entity.AdmissionMaster.TransferCertificate;
import com.backend.school_erp.config.DatabaseConfig; // 1. Import your AWS Config
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class TCService {

    private final ArrearFeeService arrearFeeService;
    private final ObjectMapper objectMapper;
    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    public TCService(ArrearFeeService arrearFeeService) {
        this.arrearFeeService = arrearFeeService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    // --- Updated Dynamic AWS DB Connection ---
    private JdbcTemplate getJdbcTemplate(String schoolId) {
        DataSource ds = dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("Initializing AWS RDS connection for school: {}", id);

            HikariConfig config = new HikariConfig();

            // 2. Using AWS DB Constants from DatabaseConfig
            // Appends schoolId as the DB name to the base AWS URL
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName(DatabaseConfig.JDBC_DRIVER);

            // Recommended pool settings for production
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);
            config.setConnectionTimeout(10000);

            return new HikariDataSource(config);
        });
        return new JdbcTemplate(ds);
    }

    // --- Helper Class for Calculation ---
    private static class StudentFeeCalc {
        double acadFixed = 0;
        double acadPaid = 0; // Cash
        double acadConc = 0;

        double transFixed = 0;
        double transPaid = 0; // Cash
        double transConc = 0;

        Map<String, Double> demandMap = new HashMap<>();
        Map<String, Double> paidMap = new HashMap<>();

        Set<String> existingFixedHeads = new HashSet<>();
    }

    public StudentTCProfileDTO getStudentTCProfile(String schoolId, String admissionNumber, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String safeYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");

        Map<String, Object> studentData = new HashMap<>();
        String aadharNumber = "";
        String community = "";
        String savedCommunityOption = null;
        boolean tcAlreadyGenerated = false;

        try {
            String tcTable = "TC_" + safeYear;
            if (tableExists(jdbc, tcTable)) {
                try {
                    String tcSql = "SELECT * FROM " + tcTable + " WHERE admission_number = ?";
                    List<Map<String, Object>> tcRows = jdbc.queryForList(tcSql, admissionNumber);
                    if (!tcRows.isEmpty()) {
                        tcAlreadyGenerated = true;
                        Map<String, Object> tcRow = tcRows.get(0);
                        String jsonData = (String) tcRow.get("tc_data_json");

                        if (jsonData != null && !jsonData.isEmpty()) {
                            try {
                                Map<String, Object> savedData = objectMapper.readValue(jsonData, Map.class);
                                savedCommunityOption = (String) savedData.get("communityOption");
                            } catch (Exception e) {
                                log.error("Error parsing saved TC JSON", e);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Error fetching existing TC data", e);
                }
            }

            String admSql = "SELECT * FROM admissions_" + safeYear + " WHERE admission_number = ?";
            studentData = jdbc.queryForMap(admSql, admissionNumber);
            aadharNumber = (String) studentData.getOrDefault("aadhar_number", studentData.getOrDefault("aadhar_no", ""));
            community = (String) studentData.getOrDefault("community", "");

        } catch (Exception e) {
            log.warn("Student not found in admission table");
            studentData.put("studentName", "Unknown");
            studentData.put("admissionNumber", admissionNumber);
        }

        StudentFeeCalc calc = calculateDuesUsingBalanceList4Logic(jdbc, admissionNumber, academicYear, safeYear);

        double acadBal = Math.max(0, calc.acadFixed - (calc.acadPaid + calc.acadConc));
        double transBal = Math.max(0, calc.transFixed - (calc.transPaid + calc.transConc));
        double totalBal = acadBal + transBal;

        List<String> pendingDetails = new ArrayList<>();
        for (Map.Entry<String, Double> entry : calc.demandMap.entrySet()) {
            String head = entry.getKey();
            double required = entry.getValue();
            double paid = calc.paidMap.getOrDefault(head, 0.0);
            if ((required - paid) > 0.5) {
                pendingDetails.add(head + ": ₹" + String.format("%.2f", (required - paid)));
            }
        }
        Collections.sort(pendingDetails);

        List<ArrearFeeDTO> individualArrears = new ArrayList<>();
        for (Map.Entry<String, Double> entry : calc.demandMap.entrySet()) {
            String head = entry.getKey();
            double required = entry.getValue();
            double paid = calc.paidMap.getOrDefault(head, 0.0);
            double balance = required - paid;

            if (balance > 0.5) {
                ArrearFeeDTO arrear = ArrearFeeDTO.builder()
                        .admissionNumber(admissionNumber)
                        .feeHead(head)
                        .amount(balance)
                        .academicYear(academicYear)
                        .accountHead(head.contains("Transport") || head.contains("Bus") ? "Transport" : "General")
                        .build();
                individualArrears.add(arrear);
            }
        }

        String finalCommunityOption = (savedCommunityOption != null) ? savedCommunityOption : determineCommunityOption(community);

        return StudentTCProfileDTO.builder()
                .studentData(studentData)
                .academicFixed(calc.acadFixed)
                .academicPaid(calc.acadPaid + calc.acadConc)
                .academicBalance(acadBal)
                .transportFixed(calc.transFixed)
                .transportPaid(calc.transPaid + calc.transConc)
                .transportBalance(transBal)
                .totalFixed(calc.acadFixed + calc.transFixed)
                .totalPaid(calc.acadPaid + calc.transPaid + calc.acadConc + calc.transConc)
                .totalPendingBalance(totalBal)
                .pendingFeeDetails(pendingDetails)
                .individualArrears(individualArrears)
                .aadharNumber(aadharNumber)
                .community(community)
                .suggestedCommunityOption(finalCommunityOption)
                .tcAlreadyGenerated(tcAlreadyGenerated)
                .canIssueTC(totalBal <= 0.01 && !tcAlreadyGenerated)
                .academicYear(academicYear)
                .build();
    }

    private String determineCommunityOption(String community) {
        if (community == null || community.trim().isEmpty()) return null;
        String communityLower = community.toLowerCase().trim();
        if (communityLower.contains("adi dravidar") || communityLower.contains("sc") || communityLower.contains("st") || communityLower.contains("scheduled caste") || communityLower.contains("scheduled tribe")) {
            return "a";
        } else if (communityLower.contains("backward") && !communityLower.contains("most backward")) {
            return "b";
        } else if (communityLower.contains("most backward") || communityLower.contains("mbc")) {
            return "c";
        } else if (communityLower.contains("converted") && communityLower.contains("christianity")) {
            return "d";
        }
        return null;
    }

    private boolean checkIfTCExists(JdbcTemplate jdbc, String admissionNumber, String safeYear) {
        try {
            String tcTable = "TC_" + safeYear;
            if (!tableExists(jdbc, tcTable)) return false;
            String sql = "SELECT COUNT(*) FROM " + tcTable + " WHERE admission_number = ?";
            Integer count = jdbc.queryForObject(sql, Integer.class, admissionNumber);
            return count != null && count > 0;
        } catch (Exception e) {
            log.error("Error checking TC existence", e);
            return false;
        }
    }

    public boolean checkIfTCExists(String schoolId, String admissionNumber, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String safeYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        return checkIfTCExists(jdbc, admissionNumber, safeYear);
    }

    private StudentFeeCalc calculateDuesUsingBalanceList4Logic(JdbcTemplate jdbc, String admNo, String academicYear, String safeYear) {
        StudentFeeCalc calc = new StudentFeeCalc();
        String[] fixedTables = {"tuition_fees_" + safeYear, "hostel_fees_" + safeYear, "transport_fees_" + safeYear};

        for (String table : fixedTables) {
            if (tableExists(jdbc, table)) {
                boolean isTransTable = table.contains("transport");
                String sql = "SELECT fee_heading, amount FROM " + table + " WHERE admission_number = ?";
                try {
                    jdbc.query(sql, rs -> {
                        String head = rs.getString("fee_heading");
                        double amt = rs.getDouble("amount");
                        calc.existingFixedHeads.add(head);
                        calc.demandMap.merge(head, amt, Double::sum);
                        if (isTransTable) calc.transFixed += amt;
                        else calc.acadFixed += amt;
                    }, admNo);
                } catch (Exception e) {}
            }
        }

        if (tableExists(jdbc, "individual_fees")) {
            try {
                jdbc.query("SELECT fee_head, amount FROM individual_fees WHERE admission_number = ? AND academic_year = ?", rs -> {
                    String head = rs.getString("fee_head");
                    double amt = rs.getDouble("amount");
                    calc.existingFixedHeads.add(head);
                    calc.demandMap.merge(head, amt, Double::sum);
                    calc.acadFixed += amt;
                }, admNo, academicYear);
            } catch (Exception e) {}
        }

        processCollectionTable(jdbc, "daily_fee_collection", admNo, academicYear, calc);
        processCollectionTable(jdbc, "miscellaneous_fee_collection", admNo, academicYear, calc);

        return calc;
    }

    private void processCollectionTable(JdbcTemplate jdbc, String tableName, String admNo, String academicYear, StudentFeeCalc calc) {
        if (!tableExists(jdbc, tableName)) return;
        String sql = "SELECT fee_head, SUM(paid_amount) as paid, SUM(concession_amount) as conc " +
                "FROM " + tableName + " WHERE admission_number = ? AND academic_year = ? GROUP BY fee_head";
        try {
            jdbc.query(sql, rs -> {
                String head = rs.getString("fee_head");
                double paid = rs.getDouble("paid");
                double conc = rs.getDouble("conc");
                double totalPaidForHead = paid + conc;
                calc.paidMap.merge(head, totalPaidForHead, Double::sum);
                double virtualDemand = paid + conc;
                boolean isTransport = head != null && head.toLowerCase().matches(".*(transp|bus|van).*");

                if (isTransport) {
                    calc.transPaid += paid;
                    calc.transConc += conc;
                    if (!calc.existingFixedHeads.contains(head)) {
                        calc.transFixed += virtualDemand;
                        calc.existingFixedHeads.add(head);
                        calc.demandMap.merge(head, virtualDemand, Double::sum);
                    }
                } else {
                    calc.acadPaid += paid;
                    calc.acadConc += conc;
                    if (!calc.existingFixedHeads.contains(head)) {
                        calc.acadFixed += virtualDemand;
                        calc.existingFixedHeads.add(head);
                        calc.demandMap.merge(head, virtualDemand, Double::sum);
                    }
                }
            }, admNo, academicYear);
        } catch (Exception e) {}
    }

    @Transactional(rollbackFor = Exception.class)
    public TransferCertificate generateTC(String schoolId, TCRequestDTO request) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String academicYear = request.getAcademicYear();
        String safeYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");

        if (checkIfTCExists(jdbc, request.getAdmissionNumber(), safeYear)) {
            throw new IllegalStateException("TC already generated for this student.");
        }

        ensureTCTableExists(jdbc, safeYear);
        StudentFeeCalc calc = calculateDuesUsingBalanceList4Logic(jdbc, request.getAdmissionNumber(), academicYear, safeYear);
        double acadBal = Math.max(0, calc.acadFixed - (calc.acadPaid + calc.acadConc));
        double transBal = Math.max(0, calc.transFixed - (calc.transPaid + calc.transConc));
        double totalPending = acadBal + transBal;

        if (totalPending > 0.01) {
            for (Map.Entry<String, Double> entry : calc.demandMap.entrySet()) {
                String head = entry.getKey();
                double required = entry.getValue();
                double paid = calc.paidMap.getOrDefault(head, 0.0);
                double balance = required - paid;
                if (balance > 0.5) {
                    createArrear(schoolId, request, head, balance, academicYear);
                }
            }
        }

        String tcTable = "TC_" + safeYear;
        String jsonData = "{}";
        try {
            Map<String, Object> enhancedData = new HashMap<>();
            enhancedData.put("tcRequest", request);
            enhancedData.put("communityOption", request.getCommunityOption());
            jsonData = objectMapper.writeValueAsString(enhancedData);
        } catch (Exception e) {
            log.error("Error serializing TC data", e);
        }

        String insertSql = String.format("INSERT INTO %s (tc_number, admission_number, student_name, standard, section, date_of_leaving, reason, conduct, fee_balance_shifted, school_id, academic_year, tc_data_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", tcTable);

        jdbc.update(insertSql, request.getTcNumber(), request.getAdmissionNumber(), request.getStudentName(),
                request.getStandard(), request.getSection(), request.getDateOfLeaving(),
                request.getReasonForLeaving(), request.getConduct(), totalPending,
                schoolId, academicYear, jsonData);

        return TransferCertificate.builder()
                .tcNumber(request.getTcNumber())
                .studentName(request.getStudentName())
                .feeBalanceShifted(totalPending)
                .build();
    }

    private void createArrear(String schoolId, TCRequestDTO req, String head, Double amount, String academicYear) {
        ArrearFeeDTO arrear = ArrearFeeDTO.builder()
                .admissionNumber(req.getAdmissionNumber())
                .studentName(req.getStudentName())
                .standard(req.getStandard())
                .amount(amount)
                .feeHead(head)
                .inOut("OUT")
                .academicYear(academicYear)
                .accountHead(head.contains("Transport") || head.contains("Bus") ? "Transport" : "General")
                .build();
        arrearFeeService.addArrearFee(schoolId, arrear);
    }

    private void ensureTCTableExists(JdbcTemplate jdbc, String safeYear) {
        String sql = "CREATE TABLE IF NOT EXISTS TC_" + safeYear + " (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, tc_number VARCHAR(100), admission_number VARCHAR(50), " +
                "student_name VARCHAR(255), standard VARCHAR(50), section VARCHAR(50), date_of_leaving DATE, " +
                "reason TEXT, conduct VARCHAR(100), fee_balance_shifted DECIMAL(12,2) DEFAULT 0, " +
                "tc_data_json TEXT, school_id VARCHAR(50), academic_year VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
        jdbc.execute(sql);
    }

    private boolean tableExists(JdbcTemplate jdbc, String tableName) {
        try {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", Integer.class, tableName);
            return count != null && count > 0;
        } catch (Exception e) { return false; }
    }

    public List<TCListResponseDTO> getGeneratedTCs(String schoolId, String academicYear, String standard, String section, String search) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String safeYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        String tcTable = "TC_" + safeYear;

        if (!tableExists(jdbc, tcTable)) return new ArrayList<>();

        StringBuilder sql = new StringBuilder("SELECT * FROM " + tcTable + " WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (standard != null && !standard.isEmpty()) {
            sql.append(" AND standard = ?");
            params.add(standard);
        }
        if (section != null && !section.isEmpty()) {
            sql.append(" AND section = ?");
            params.add(section);
        }
        if (search != null && !search.isEmpty()) {
            sql.append(" AND (student_name LIKE ? OR admission_number LIKE ? OR tc_number LIKE ?)");
            String queryParam = "%" + search + "%";
            params.add(queryParam); params.add(queryParam); params.add(queryParam);
        }
        sql.append(" ORDER BY id DESC");

        try {
            return jdbc.query(sql.toString(), (rs, rowNum) -> {
                Timestamp createdAt = rs.getTimestamp("created_at");
                String issueDateStr = (createdAt != null) ? createdAt.toString().split(" ")[0] : "";
                java.sql.Date dateLeft = rs.getDate("date_of_leaving");
                String dateLeftStr = (dateLeft != null) ? dateLeft.toString() : "";

                return TCListResponseDTO.builder()
                        .id(rs.getLong("id"))
                        .tcNumber(rs.getString("tc_number"))
                        .admissionNumber(rs.getString("admission_number"))
                        .studentName(rs.getString("student_name"))
                        .standard(rs.getString("standard"))
                        .section(rs.getString("section"))
                        .dateOfLeaving(dateLeftStr)
                        .issueDate(issueDateStr)
                        .feeStatus(rs.getDouble("fee_balance_shifted") > 0 ? "Arrears Shifted" : "Cleared")
                        .build();
            }, params.toArray());
        } catch (Exception e) {
            log.error("Error fetching TC list", e);
            return new ArrayList<>();
        }
    }
}