package com.backend.school_erp.service.DebitCardReport;

import com.backend.school_erp.DTO.AdmissionMaster.StudentTCProfileDTO;
import com.backend.school_erp.DTO.DebitCardReport.PromotionCandidateDTO;
import com.backend.school_erp.DTO.DebitCardReport.PromotionRequestDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.AdmissionMaster.Admission;
import com.backend.school_erp.service.AdmissionMaster.TCService;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PromotionService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();
    private final TCService tcService;

    public PromotionService(TCService tcService) {
        this.tcService = tcService;
    }

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

    // Fetch list of academic years
    public List<String> getAcademicYears(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        jdbc.execute("CREATE TABLE IF NOT EXISTS academic_years (yearId INT AUTO_INCREMENT PRIMARY KEY, year VARCHAR(20), createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        return jdbc.queryForList("SELECT year FROM academic_years ORDER BY yearId DESC", String.class);
    }

    public List<PromotionCandidateDTO> getCandidatesForPromotion(String schoolId, String academicYear, String standard, String section, String targetAcademicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String safeYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        String admissionTable = "admissions_" + safeYear;

        ensureTableExists(jdbc, admissionTable);

        String sql = "SELECT * FROM " + admissionTable + " WHERE standard = ? AND section = ? ORDER BY student_name ASC";
        List<Admission> students = jdbc.query(sql, new BeanPropertyRowMapper<>(Admission.class), standard, section);

        // Prepare Target Table check if target year is provided
        String targetTableTemp = null;
        if (targetAcademicYear != null && !targetAcademicYear.isEmpty()) {
            String safeTarget = targetAcademicYear.replaceAll("[^a-zA-Z0-9]", "_");
            String tbl = "admissions_" + safeTarget;
            if (tableExists(jdbc, tbl)) {
                targetTableTemp = tbl;
            }
        }
        final String targetTable = targetTableTemp;

        return students.stream().map(student -> {
            boolean isTcIssued = tcService.checkIfTCExists(schoolId, student.getAdmissionNumber(), academicYear);
            StudentTCProfileDTO profile = tcService.getStudentTCProfile(schoolId, student.getAdmissionNumber(), academicYear);

            boolean isPromoted = false;
            if (targetTable != null) {
                Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM " + targetTable + " WHERE admission_number = ?", Integer.class, student.getAdmissionNumber());
                isPromoted = count != null && count > 0;
            }

            return PromotionCandidateDTO.builder()
                    .admissionNumber(student.getAdmissionNumber())
                    .studentName(student.getStudentName())
                    .status(isTcIssued ? "TC Issued" : "Active")
                    .pendingAmount(profile.getTotalPendingBalance())
                    .promoted(isPromoted)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(rollbackFor = Exception.class)
    public int promoteStudents(PromotionRequestDTO request) {
        JdbcTemplate jdbc = getJdbcTemplate(request.getSchoolId());

        String sourceSafeYear = request.getSourceAcademicYear().replaceAll("[^a-zA-Z0-9]", "_");
        String targetSafeYear = request.getTargetAcademicYear().replaceAll("[^a-zA-Z0-9]", "_");

        // Standard string formats for column values (e.g. "2026-2027")
        String standardTargetYear = request.getTargetAcademicYear().replace("_", "-");
        String standardSourceYear = request.getSourceAcademicYear().replace("_", "-");

        String sourceTable = "admissions_" + sourceSafeYear;
        String targetTable = "admissions_" + targetSafeYear;

        // 1. Ensure Target Tables Exist
        ensureTargetTables(jdbc, targetSafeYear);

        int count = 0;
        for (String admNo : request.getStudentAdmissionNumbers()) {
            // A. Check for existing student in target year
            Integer exists = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM " + targetTable + " WHERE admission_number = ?",
                    Integer.class, admNo
            );

            if (exists != null && exists > 0) {
                log.warn("Student {} already exists in target year. Skipping.", admNo);
                continue;
            }

            // B. Fetch Student Data from Source (Grade 1 Data)
            Map<String, Object> studentData = jdbc.queryForMap("SELECT * FROM " + sourceTable + " WHERE admission_number = ?", admNo);

            // C. PREPARE DATA FOR TARGET TABLE
            studentData.remove("id"); // Remove old ID to auto-generate new one
            studentData.put("standard", request.getTargetStandard());
            studentData.put("section", request.getTargetSection());
            studentData.put("academic_year", standardTargetYear);

            // Re-fetch clean data to be safe against map modification issues
            Map<String, Object> cleanSourceData = jdbc.queryForMap("SELECT standard, student_type, student_category, mother_tongue, blood_group FROM " + sourceTable + " WHERE admission_number = ?", admNo);

            studentData.put("class_last_studied", cleanSourceData.get("standard"));

            // Update Student Type
            String currentType = (String) cleanSourceData.getOrDefault("student_type", "");
            if ("New".equalsIgnoreCase(currentType)) {
                studentData.put("student_type", "Existing");
            }

            // Extract Boarding Point and Route from Source Data (FIX STEP 1)
            String boardingPoint = (String) studentData.get("boarding_point");
            String busRouteNumber = (String) studentData.get("bus_route_number");

            // Insert Student into Target Admission Table
            insertStudentMap(jdbc, targetTable, studentData);

            // D. SHIFT PENDING FEES (Old Year Arrears -> New Year Segregated Tables)
            shiftPendingFees(jdbc, request.getSchoolId(), admNo, standardSourceYear, standardTargetYear, targetSafeYear);

            // E. ASSIGN NEW YEAR FEES (Tuition, Hostel, Transport)
            // Passing source data boarding point/route to ensure transport fee is added
            assignNewYearFees(jdbc, request.getSchoolId(), admNo, sourceSafeYear, targetSafeYear,
                    standardTargetYear, request.getTargetStandard(), request.getTargetSection(),
                    studentData, boardingPoint, busRouteNumber);

            count++;
        }
        return count;
    }

    /**
     * Segregates Pending Fees into Tuition, Hostel, and Transport tables in the NEW year.
     */
    private void shiftPendingFees(JdbcTemplate jdbc, String schoolId, String admNo, String sourceYear, String targetYear, String targetSafeYear) {
        StudentTCProfileDTO profile = tcService.getStudentTCProfile(schoolId, admNo, sourceYear);

        if (profile.getIndividualArrears() == null || profile.getIndividualArrears().isEmpty()) {
            return;
        }

        // Fetch fresh student details from TARGET table for insertion
        Map<String, Object> student = jdbc.queryForMap(
                "SELECT student_name, father_name, mother_name, standard, section, aadhar_number, mother_tongue, blood_group FROM admissions_" + targetSafeYear + " WHERE admission_number = ?",
                admNo
        );

        for (var arrear : profile.getIndividualArrears()) {
            String feeHeadName = arrear.getFeeHead();
            String lowerFeeHead = feeHeadName.toLowerCase();

            // Renaming fee head to indicate it's an arrear from previous year
            String newFeeHeadName = feeHeadName + " (" + sourceYear + ")";
            String accountHead = arrear.getAccountHead() != null ? arrear.getAccountHead() : "Arrears";

            String targetFeeTable;
            boolean isTransport = false;

            // 1. Logic to Determine Target Table
            if (lowerFeeHead.contains("transport") || lowerFeeHead.contains("bus") || lowerFeeHead.contains("van")) {
                targetFeeTable = "transport_fees_" + targetSafeYear;
                isTransport = true;
            } else if (lowerFeeHead.contains("hostel") || lowerFeeHead.contains("mess") || lowerFeeHead.contains("room")) {
                targetFeeTable = "hostel_fees_" + targetSafeYear;
            } else {
                // Default everything else to Tuition Fees (includes Book fee, Term fee, etc.)
                targetFeeTable = "tuition_fees_" + targetSafeYear;
            }

            // 2. Insert into the determined table
            String sql;
            if (isTransport) {
                sql = "INSERT INTO " + targetFeeTable +
                        " (admission_number, student_name, standard, section, father_name, mother_name, fee_heading, account_head, amount, status, academic_year, school_id, aadhar_number, boarding_point, bus_route_number, course, mother_tongue, blood_group) " +
                        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                // For arrears, we default route to 'Arrear' to preserve financial data
                jdbc.update(sql, admNo, student.get("student_name"), student.get("standard"), student.get("section"),
                        student.get("father_name"), student.get("mother_name"),
                        newFeeHeadName, accountHead, arrear.getAmount(), "pending", targetYear, schoolId, student.get("aadhar_number"),
                        "Arrear", "Arrear", student.get("standard"), student.get("mother_tongue"), student.get("blood_group"));
            } else {
                sql = "INSERT INTO " + targetFeeTable +
                        " (admission_number, student_name, standard, section, father_name, mother_name, fee_heading, account_head, amount, status, academic_year, school_id, aadhar_number, course, mother_tongue, blood_group) " +
                        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                jdbc.update(sql, admNo, student.get("student_name"), student.get("standard"), student.get("section"),
                        student.get("father_name"), student.get("mother_name"),
                        newFeeHeadName, accountHead, arrear.getAmount(), "pending", targetYear, schoolId, student.get("aadhar_number"),
                        student.get("standard"), student.get("mother_tongue"), student.get("blood_group"));
            }
        }
        log.info("Shifted {} arrears for student {} to year {} segregated tables.", profile.getIndividualArrears().size(), admNo, targetYear);
    }

    private void assignNewYearFees(JdbcTemplate jdbc, String schoolId, String admNo, String sourceSafeYear, String targetSafeYear,
                                   String standardTargetYear, String targetStandard, String targetSection, Map<String, Object> bioData,
                                   String sourceBoardingPoint, String sourceRouteNumber) {
        try {
            String studentCategory = (String) bioData.getOrDefault("student_category", "General");

            // 1. TUITION FEES: Always Assign for the New Class
            assignFeesFromMasterTable(jdbc,
                    "tuition_fees", // Master Table
                    "tuition_fees_" + targetSafeYear, // Target Ledger
                    schoolId, standardTargetYear, targetStandard, studentCategory, admNo, bioData);

            // 2. HOSTEL FEES: Check if student had hostel in source year
            if (hasFeeInSource(jdbc, "hostel_fees_" + sourceSafeYear, admNo)) {
                assignFeesFromMasterTable(jdbc,
                        "hostel_fees", // Master Table
                        "hostel_fees_" + targetSafeYear, // Target Ledger
                        schoolId, standardTargetYear, targetStandard, studentCategory, admNo, bioData);
            }

            // 3. TRANSPORT FEES: FIX - Use Bio Data from Grade 1 to determine requirement
            boolean hasTransportInBio = sourceBoardingPoint != null && !sourceBoardingPoint.isEmpty()
                    && sourceRouteNumber != null && !sourceRouteNumber.isEmpty();

            if (hasTransportInBio) {
                assignTransportFeesFromMaster(jdbc,
                        "bus_fees", // Master Table (to get New Amount)
                        "transport_fees_" + targetSafeYear, // New Ledger (to insert)
                        schoolId, standardTargetYear, targetStandard, admNo, bioData,
                        sourceBoardingPoint, sourceRouteNumber); // Pass specific route info
            } else {
                log.info("No transport route found in bio-data for student {}, skipping transport fee.", admNo);
            }

            log.info("Assigned new year fees for student {} in Class {}.", admNo, targetStandard);

        } catch (Exception e) {
            log.error("Error assigning fees for new year: " + e.getMessage(), e);
        }
    }

    private void assignFeesFromMasterTable(JdbcTemplate jdbc, String masterTable, String targetTable,
                                           String schoolId, String academicYear, String standard, String studentCategory,
                                           String admNo, Map<String, Object> bioData) {

        if (!tableExists(jdbc, masterTable)) {
            log.warn("Master table {} does not exist. Cannot assign fees.", masterTable);
            return;
        }

        // Query Master Table
        String selectSql = "SELECT fee_heading, account_head, fee_amount FROM " + masterTable +
                " WHERE school_id = ? AND academic_year = ? AND standard = ? AND student_category = ?";

        List<Map<String, Object>> feeStructure = jdbc.queryForList(selectSql, schoolId, academicYear, standard, studentCategory);

        // Fallback if no specific category found
        if (feeStructure.isEmpty()) {
            feeStructure = jdbc.queryForList("SELECT fee_heading, account_head, fee_amount FROM " + masterTable +
                    " WHERE school_id = ? AND academic_year = ? AND standard = ?", schoolId, academicYear, standard);
        }

        if (feeStructure.isEmpty()) return;

        String insertSql = "INSERT INTO " + targetTable +
                " (admission_number, student_name, standard, section, father_name, mother_name, fee_heading, account_head, amount, status, academic_year, school_id, aadhar_number, course, mother_tongue, blood_group) " +
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        for (Map<String, Object> fee : feeStructure) {
            // FIX: Safely convert Amount
            BigDecimal amount = convertToBigDecimal(fee.get("fee_amount"));

            jdbc.update(insertSql,
                    admNo,
                    bioData.get("student_name"),
                    standard,
                    bioData.get("section"),
                    bioData.get("father_name"),
                    bioData.get("mother_name"),
                    fee.get("fee_heading"),
                    fee.get("account_head"),
                    amount,
                    "pending",
                    academicYear,
                    schoolId,
                    bioData.get("aadhar_number"),
                    standard,
                    bioData.get("mother_tongue"),
                    bioData.get("blood_group")
            );
        }
    }

    // FIX: Method now includes FALLBACK MECHANISM if Route Name changes between years
    private void assignTransportFeesFromMaster(JdbcTemplate jdbc, String masterBusTable, String newLedgerTable,
                                               String schoolId, String academicYear, String standard,
                                               String admNo, Map<String, Object> bioData,
                                               String boardingPoint, String routeNumber) {

        // 1. Validate Master Table Exists
        if (!tableExists(jdbc, masterBusTable)) {
            log.warn("Master bus_fees table missing. Cannot assign transport fees.");
            return;
        }

        log.info("Fetching transport fee for BP: {} Route: {} Year: {}", boardingPoint, routeNumber, academicYear);

        // 2. Get Fee Amount from MASTER 'bus_fees'
        // Attempt 1: Exact Match
        String feeSql = "SELECT fee_heading, account_head, fee FROM " + masterBusTable +
                " WHERE school_id = ? AND academic_year = ? AND boarding_point = ? AND route_number = ?";

        List<Map<String, Object>> busFees = jdbc.queryForList(feeSql, schoolId, academicYear, boardingPoint, routeNumber);

        // Attempt 2: Fallback (Match only Boarding Point if Route ID changed/mismatched)
        if (busFees.isEmpty()) {
            log.warn("Exact match not found for BP: {} Route: {}. Attempting fallback to Boarding Point only.", boardingPoint, routeNumber);
            String fallbackSql = "SELECT fee_heading, account_head, fee FROM " + masterBusTable +
                    " WHERE school_id = ? AND academic_year = ? AND boarding_point = ? LIMIT 1";
            busFees = jdbc.queryForList(fallbackSql, schoolId, academicYear, boardingPoint);
        }

        if (busFees.isEmpty()) {
            log.warn("No transport fee definition found in master 'bus_fees' for {} in year {}. Manual entry required.", boardingPoint, academicYear);
            return;
        }

        String insertSql = "INSERT INTO " + newLedgerTable +
                " (admission_number, student_name, standard, section, father_name, mother_name, fee_heading, account_head, amount, status, academic_year, school_id, aadhar_number, boarding_point, bus_route_number, course, mother_tongue, blood_group) " +
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        for (Map<String, Object> fee : busFees) {
            // FIX: Safely convert Amount (Fixes the ClassCastException Double -> BigDecimal)
            BigDecimal amount = convertToBigDecimal(fee.get("fee"));

            jdbc.update(insertSql,
                    admNo,
                    bioData.get("student_name"),
                    standard,
                    bioData.get("section"),
                    bioData.get("father_name"),
                    bioData.get("mother_name"),
                    fee.get("fee_heading"),
                    fee.get("account_head"),
                    amount,
                    "pending",
                    academicYear,
                    schoolId,
                    bioData.get("aadhar_number"),
                    boardingPoint,
                    routeNumber,
                    standard,
                    bioData.get("mother_tongue"),
                    bioData.get("blood_group")
            );
            log.info("Successfully added transport fee for student {} via logic.", admNo);
        }
    }

    /**
     * Helper method to safely convert database numerical values to BigDecimal.
     * Handles Double, Float, Integer, Long, and BigDecimal types.
     */
    private BigDecimal convertToBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal) {
            return (BigDecimal) value;
        }
        if (value instanceof Double) {
            return BigDecimal.valueOf((Double) value);
        }
        if (value instanceof Float) {
            return BigDecimal.valueOf((Float) value);
        }
        if (value instanceof Number) {
            // For Integer, Long, etc.
            return new BigDecimal(value.toString());
        }
        try {
            // Try string parsing as last resort
            return new BigDecimal(value.toString());
        } catch (Exception e) {
            log.error("Failed to convert value to BigDecimal: {}", value);
            return BigDecimal.ZERO;
        }
    }

    private boolean hasFeeInSource(JdbcTemplate jdbc, String tableName, String admNo) {
        if (!tableExists(jdbc, tableName)) return false;
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM " + tableName + " WHERE admission_number = ? AND fee_heading NOT LIKE '%Arrear%'",
                Integer.class, admNo
        );
        return count != null && count > 0;
    }

    private void insertStudentMap(JdbcTemplate jdbc, String tableName, Map<String, Object> data) {
        StringBuilder cols = new StringBuilder();
        StringBuilder vals = new StringBuilder();
        List<Object> values = new java.util.ArrayList<>();

        for (Map.Entry<String, Object> entry : data.entrySet()) {
            if (cols.length() > 0) {
                cols.append(", ");
                vals.append(", ");
            }
            cols.append(entry.getKey());
            vals.append("?");
            values.add(entry.getValue());
        }

        String sql = "INSERT INTO " + tableName + " (" + cols + ") VALUES (" + vals + ")";
        jdbc.update(sql, values.toArray());
    }

    private void ensureTargetTables(JdbcTemplate jdbc, String safeYear) {
        String admTable = "admissions_" + safeYear;
        if (!tableExists(jdbc, admTable)) {
            String prevYearPart = safeYear.split("_")[0];
            try {
                int prevYearStart = Integer.parseInt(prevYearPart) - 1;
                String prevYearFull = prevYearStart + "_" + (prevYearStart + 1);
                String sqlClone = "CREATE TABLE IF NOT EXISTS " + admTable + " LIKE admissions_" + prevYearFull;
                jdbc.execute(sqlClone);
            } catch(Exception e) {
                log.warn("Could not clone table structure. Ensure manual creation or check previous year tables.");
            }
        }
        createFeeTableIfNotExists(jdbc, "tuition_fees_" + safeYear);
        createFeeTableIfNotExists(jdbc, "hostel_fees_" + safeYear);
        createFeeTableIfNotExists(jdbc, "transport_fees_" + safeYear);
    }

    private void createFeeTableIfNotExists(JdbcTemplate jdbc, String tableName) {
        if (tableExists(jdbc, tableName)) return;
        String sql;
        if (tableName.contains("transport")) {
            sql = "CREATE TABLE IF NOT EXISTS " + tableName + " (id BIGINT AUTO_INCREMENT PRIMARY KEY, admission_number VARCHAR(100), student_name VARCHAR(255), standard VARCHAR(50), section VARCHAR(50), father_name VARCHAR(255), mother_name VARCHAR(255), fee_heading VARCHAR(255), account_head VARCHAR(255), amount DECIMAL(10,2), status VARCHAR(20), academic_year VARCHAR(50), school_id VARCHAR(50), course VARCHAR(100), aadhar_number VARCHAR(50), boarding_point VARCHAR(100), bus_route_number VARCHAR(100), mother_tongue VARCHAR(100), blood_group VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
        } else {
            sql = "CREATE TABLE IF NOT EXISTS " + tableName + " (id BIGINT AUTO_INCREMENT PRIMARY KEY, admission_number VARCHAR(100), student_name VARCHAR(255), standard VARCHAR(50), section VARCHAR(50), father_name VARCHAR(255), mother_name VARCHAR(255), fee_heading VARCHAR(255), account_head VARCHAR(255), amount DECIMAL(10,2), status VARCHAR(20), academic_year VARCHAR(50), school_id VARCHAR(50), course VARCHAR(100), aadhar_number VARCHAR(50), mother_tongue VARCHAR(100), blood_group VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
        }
        jdbc.execute(sql);
    }

    private boolean tableExists(JdbcTemplate jdbc, String tableName) {
        try {
            List<String> tables = jdbc.queryForList("SHOW TABLES LIKE '" + tableName + "'", String.class);
            return !tables.isEmpty();
        } catch (Exception e) { return false; }
    }

    private void ensureTableExists(JdbcTemplate jdbc, String tableName) {
        if (!tableExists(jdbc, tableName)) throw new RuntimeException("Table " + tableName + " does not exist.");
    }
}