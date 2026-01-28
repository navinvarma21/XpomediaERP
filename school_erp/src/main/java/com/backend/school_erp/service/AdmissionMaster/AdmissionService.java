package com.backend.school_erp.service.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.*;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.AdmissionMaster.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.web.multipart.MultipartFile;

import javax.sql.DataSource;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class AdmissionService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();
    private final EnquiryService enquiryService;

    public AdmissionService(EnquiryService enquiryService) {
        this.enquiryService = enquiryService;
    }

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
            config.setLeakDetectionThreshold(60000);
            return new HikariDataSource(config);
        });
    }

    public JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private String getAdmissionTableName(String academicYear) {
        String sanitizedYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        return "admissions_" + sanitizedYear;
    }

    private String getTuitionFeeTableName(String academicYear) {
        String sanitizedYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        return "tuition_fees_" + sanitizedYear;
    }

    private String getHostelFeeTableName(String academicYear) {
        String sanitizedYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        return "hostel_fees_" + sanitizedYear;
    }

    private String getTransportFeeTableName(String academicYear) {
        String sanitizedYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        return "transport_fees_" + sanitizedYear;
    }

    private void ensureTablesExist(JdbcTemplate jdbc, String academicYear) {
        String admissionTable = getAdmissionTableName(academicYear);
        String tuitionFeeTable = getTuitionFeeTableName(academicYear);
        String hostelFeeTable = getHostelFeeTableName(academicYear);
        String transportFeeTable = getTransportFeeTableName(academicYear);

        // Create admissions table (REMOVED TOTAL FEE COLUMNS)
        jdbc.execute(String.format("""
            CREATE TABLE IF NOT EXISTS %s (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                enquiry_key VARCHAR(100),
                admission_number VARCHAR(100) NOT NULL UNIQUE,
                student_photo MEDIUMBLOB,
                student_photo_content_type VARCHAR(100),
                student_name VARCHAR(255) NOT NULL,
                father_name VARCHAR(255) NOT NULL,
                mother_name VARCHAR(255) NOT NULL,
                street_village VARCHAR(255),
                place_pincode VARCHAR(20),
                district VARCHAR(100),
                phone_number VARCHAR(20),
                phone_number2 VARCHAR(20),
                boarding_point VARCHAR(100),
                bus_route_number VARCHAR(100),
                email_id VARCHAR(255),
                communication_address TEXT,
                nationality VARCHAR(100),
                religion VARCHAR(100),
                state VARCHAR(100),
                community VARCHAR(100),
                caste VARCHAR(100),
                student_type VARCHAR(50),
                student_category VARCHAR(100),
                standard VARCHAR(50) NOT NULL,
                section VARCHAR(50),
                gender VARCHAR(20),
                date_of_birth DATE,
                emis VARCHAR(100),
                lunch_refresh VARCHAR(100),
                blood_group VARCHAR(10),
                date_of_admission DATE,
                mother_tongue VARCHAR(100),
                father_occupation VARCHAR(100),
                mother_occupation VARCHAR(100),
                exam_number VARCHAR(100),
                studied_year VARCHAR(50),
                class_last_studied VARCHAR(50),
                class_to_be_admitted VARCHAR(50),
                name_of_school VARCHAR(255),
                remarks TEXT,
                identification_mark1 VARCHAR(255),
                identification_mark2 VARCHAR(255),
                aadhar_number VARCHAR(20),
                qr_code_data TEXT,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_admission_number (admission_number),
                INDEX idx_student_name (student_name),
                INDEX idx_standard (standard),
                INDEX idx_school_academic (school_id, academic_year)
            )
        """, admissionTable));

        // Create tuition_fees table (ADDED 'status' column)
        jdbc.execute(String.format("""
            CREATE TABLE IF NOT EXISTS %s (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                admission_number VARCHAR(100) NOT NULL,
                student_name VARCHAR(255),
                standard VARCHAR(50),
                course VARCHAR(100),
                section VARCHAR(50),
                father_name VARCHAR(255),
                mother_name VARCHAR(255),
                aadhar_number VARCHAR(50),
                mother_tongue VARCHAR(100),
                blood_group VARCHAR(20),
                fee_heading VARCHAR(255) NOT NULL,
                account_head VARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                academic_year VARCHAR(50) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admission_number) REFERENCES %s(admission_number) ON DELETE CASCADE,
                INDEX idx_admission_number (admission_number),
                INDEX idx_school_year (school_id, academic_year)
            )
        """, tuitionFeeTable, admissionTable));

        // Create hostel_fees table (ADDED 'status' column)
        jdbc.execute(String.format("""
            CREATE TABLE IF NOT EXISTS %s (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                admission_number VARCHAR(100) NOT NULL,
                student_name VARCHAR(255),
                standard VARCHAR(50),
                course VARCHAR(100),
                section VARCHAR(50),
                father_name VARCHAR(255),
                mother_name VARCHAR(255),
                aadhar_number VARCHAR(50),
                mother_tongue VARCHAR(100),
                blood_group VARCHAR(20),
                fee_heading VARCHAR(255) NOT NULL,
                account_head VARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                academic_year VARCHAR(50) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admission_number) REFERENCES %s(admission_number) ON DELETE CASCADE,
                INDEX idx_admission_number (admission_number),
                INDEX idx_school_year (school_id, academic_year)
            )
        """, hostelFeeTable, admissionTable));

        // Create transport_fees table (ADDED 'status' column)
        jdbc.execute(String.format("""
            CREATE TABLE IF NOT EXISTS %s (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                admission_number VARCHAR(100) NOT NULL,
                student_name VARCHAR(255),
                standard VARCHAR(50),
                course VARCHAR(100),
                section VARCHAR(50),
                father_name VARCHAR(255),
                mother_name VARCHAR(255),
                aadhar_number VARCHAR(50),
                mother_tongue VARCHAR(100),
                blood_group VARCHAR(20),
                fee_heading VARCHAR(255) NOT NULL,
                account_head VARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                boarding_point VARCHAR(100),
                bus_route_number VARCHAR(100),
                academic_year VARCHAR(50) NOT NULL,
                school_id VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admission_number) REFERENCES %s(admission_number) ON DELETE CASCADE,
                INDEX idx_admission_number (admission_number),
                INDEX idx_school_year (school_id, academic_year)
            )
        """, transportFeeTable, admissionTable));

        log.info("✅ All tables ensured to exist for academic year: {}", academicYear);
    }

    @Transactional
    public Admission createAdmissionWithPhoto(String schoolId, AdmissionDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String academicYear = dto.getAcademicYear();
        ensureTablesExist(jdbc, academicYear);
        validateAdmissionDTO(dto);

        // Check if admission number already exists
        if (checkAdmissionNumberExists(schoolId, dto.getAdmissionNumber(), academicYear)) {
            throw new RuntimeException("Admission number already exists: " + dto.getAdmissionNumber());
        }

        String admissionTable = getAdmissionTableName(academicYear);

        // Insert into admissions table
        String sql = String.format("""
            INSERT INTO %s (
                enquiry_key, admission_number, student_photo, student_photo_content_type,
                student_name, father_name, mother_name, street_village, place_pincode,
                district, phone_number, phone_number2, boarding_point, bus_route_number, email_id,
                communication_address, nationality, religion, state, community, caste,
                student_type, student_category, standard, section, gender, date_of_birth,
                emis, lunch_refresh, blood_group, date_of_admission, mother_tongue,
                father_occupation, mother_occupation, exam_number,
                studied_year, class_last_studied, class_to_be_admitted,
                name_of_school, remarks, identification_mark1, identification_mark2,
                aadhar_number, qr_code_data, school_id, academic_year
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                     ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                     ?, ?, ?, ?, ?, ?)
        """, admissionTable);

        // Handle file upload
        byte[] photoBytes = null;
        String contentType = null;

        if (dto.getStudentPhotoFile() != null && !dto.getStudentPhotoFile().isEmpty()) {
            try {
                photoBytes = dto.getStudentPhotoFile().getBytes();
                contentType = dto.getStudentPhotoFile().getContentType();
                log.info("📷 Processing photo file: {} bytes, type: {}", photoBytes.length, contentType);
            } catch (IOException e) {
                log.error("❌ Error processing student photo file", e);
                throw new RuntimeException("Failed to process student photo", e);
            }
        }

        Object[] params = new Object[]{
                dto.getEnquiryKey(),
                dto.getAdmissionNumber(),
                photoBytes,
                contentType,
                dto.getStudentName(),
                dto.getFatherName(),
                dto.getMotherName(),
                dto.getStreetVillage(),
                dto.getPlacePincode(),
                dto.getDistrict(),
                dto.getPhoneNumber(),
                dto.getPhoneNumber2(),
                dto.getBoardingPoint(),
                dto.getBusRouteNumber(),
                dto.getEmailId(),
                dto.getCommunicationAddress(),
                dto.getNationality(),
                dto.getReligion(),
                dto.getState(),
                dto.getCommunity(),
                dto.getCaste(),
                dto.getStudentType(),
                dto.getStudentCategory(),
                dto.getStandard(),
                dto.getSection(),
                dto.getGender(),
                dto.getDateOfBirth(),
                dto.getEmis(),
                dto.getLunchRefresh(),
                dto.getBloodGroup(),
                dto.getDateOfAdmission(),
                dto.getMotherTongue(),
                dto.getFatherOccupation(),
                dto.getMotherOccupation(),
                dto.getExamNumber(),
                dto.getStudiedYear(),
                dto.getClassLastStudied(),
                dto.getClassToBeAdmitted(),
                dto.getNameOfSchool(),
                dto.getRemarks(),
                dto.getIdentificationMark1(),
                dto.getIdentificationMark2(),
                dto.getAadharNumber(),
                dto.getQrCodeData(),
                dto.getSchoolId(),
                dto.getAcademicYear()
        };

        try {
            jdbc.update(sql, params);
            Long admissionId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            log.info("✅ Admission created with ID: {}", admissionId);

            // Insert fee details into separate tables (PASSING FULL DTO TO STORE STUDENT DATA)
            insertTuitionFees(jdbc, schoolId, dto, dto.getTuitionFees());
            insertHostelFees(jdbc, schoolId, dto, dto.getHostelFees());
            insertTransportFee(jdbc, schoolId, dto, dto.getTransportFee());

            // Delete enquiry if exists
            if (dto.getEnquiryKey() != null && !dto.getEnquiryKey().trim().isEmpty()) {
                deleteEnquiryByKey(schoolId, dto.getEnquiryKey());
            }

            return getAdmissionById(schoolId, admissionId, academicYear)
                    .orElseThrow(() -> new RuntimeException("Failed to retrieve created admission"));

        } catch (Exception e) {
            log.error("❌ Database error creating admission", e);
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }
    }

    // UPDATED: Added 'status' column and value 'pending'
    private void insertTuitionFees(JdbcTemplate jdbc, String schoolId, AdmissionDTO dto,
                                   List<TuitionFeeDTO> tuitionFees) {
        if (tuitionFees == null || tuitionFees.isEmpty()) return;

        String tableName = getTuitionFeeTableName(dto.getAcademicYear());
        String sql = String.format("""
            INSERT INTO %s (
                admission_number, student_name, standard, course, section, father_name, mother_name, 
                aadhar_number, mother_tongue, blood_group,
                fee_heading, account_head, amount, status, academic_year, school_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, tableName);

        for (TuitionFeeDTO fee : tuitionFees) {
            jdbc.update(sql,
                    dto.getAdmissionNumber(),
                    dto.getStudentName(),
                    dto.getStandard(),
                    dto.getStandard(), // Mapping Standard to Course as well
                    dto.getSection(),
                    dto.getFatherName(),
                    dto.getMotherName(),
                    dto.getAadharNumber(),
                    dto.getMotherTongue(),
                    dto.getBloodGroup(),
                    // phone_number removed
                    fee.getFeeHeading(),
                    fee.getAccountHead(),
                    fee.getAmount(),
                    "pending", // Added status value
                    dto.getAcademicYear(),
                    schoolId
            );
        }
        log.info("✅ Inserted {} tuition fees with 'pending' status for admission number: {}", tuitionFees.size(), dto.getAdmissionNumber());
    }

    // UPDATED: Added 'status' column and value 'pending'
    private void insertHostelFees(JdbcTemplate jdbc, String schoolId, AdmissionDTO dto,
                                  List<HostelFeeDTO> hostelFees) {
        if (hostelFees == null || hostelFees.isEmpty()) return;

        String tableName = getHostelFeeTableName(dto.getAcademicYear());
        String sql = String.format("""
            INSERT INTO %s (
                admission_number, student_name, standard, course, section, father_name, mother_name, 
                aadhar_number, mother_tongue, blood_group,
                fee_heading, account_head, amount, status, academic_year, school_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, tableName);

        for (HostelFeeDTO fee : hostelFees) {
            jdbc.update(sql,
                    dto.getAdmissionNumber(),
                    dto.getStudentName(),
                    dto.getStandard(),
                    dto.getStandard(), // Mapping Standard to Course
                    dto.getSection(),
                    dto.getFatherName(),
                    dto.getMotherName(),
                    dto.getAadharNumber(),
                    dto.getMotherTongue(),
                    dto.getBloodGroup(),
                    // phone_number removed
                    fee.getFeeHeading(),
                    fee.getAccountHead(),
                    fee.getAmount(),
                    "pending", // Added status value
                    dto.getAcademicYear(),
                    schoolId
            );
        }
        log.info("✅ Inserted {} hostel fees with 'pending' status for admission number: {}", hostelFees.size(), dto.getAdmissionNumber());
    }

    // UPDATED: Added 'status' column and value 'pending'
    private void insertTransportFee(JdbcTemplate jdbc, String schoolId, AdmissionDTO dto,
                                    TransportFeeDTO transportFee) {
        if (transportFee == null) return;

        String tableName = getTransportFeeTableName(dto.getAcademicYear());
        String sql = String.format("""
            INSERT INTO %s (
                admission_number, student_name, standard, course, section, father_name, mother_name, 
                aadhar_number, mother_tongue, blood_group,
                fee_heading, account_head, amount, status, boarding_point, bus_route_number, academic_year, school_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, tableName);

        jdbc.update(sql,
                dto.getAdmissionNumber(),
                dto.getStudentName(),
                dto.getStandard(),
                dto.getStandard(), // Mapping Standard to Course
                dto.getSection(),
                dto.getFatherName(),
                dto.getMotherName(),
                dto.getAadharNumber(),
                dto.getMotherTongue(),
                dto.getBloodGroup(),
                // phone_number removed
                transportFee.getFeeHeading(),
                transportFee.getAccountHead(),
                transportFee.getAmount(),
                "pending", // Added status value
                transportFee.getBoardingPoint(),
                transportFee.getBusRouteNumber(),
                dto.getAcademicYear(),
                schoolId
        );
        log.info("✅ Inserted transport fee with 'pending' status for admission number: {}", dto.getAdmissionNumber());
    }

    @Transactional
    public Optional<Admission> updateAdmissionWithPhoto(String schoolId, Long id, AdmissionDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String academicYear = dto.getAcademicYear();
        ensureTablesExist(jdbc, academicYear);
        validateAdmissionDTO(dto);

        Optional<Admission> existing = getAdmissionById(schoolId, id, academicYear);
        if (existing.isEmpty()) {
            log.warn("❌ Admission not found for update: ID {}", id);
            return Optional.empty();
        }

        String admissionTable = getAdmissionTableName(academicYear);

        // Check for duplicate admission number
        Integer count = jdbc.queryForObject(
                String.format("SELECT COUNT(*) FROM %s WHERE admission_number = ? AND school_id = ? AND id != ?", admissionTable),
                Integer.class, dto.getAdmissionNumber(), schoolId, id
        );
        if (count != null && count > 0) {
            throw new RuntimeException("Admission number already exists: " + dto.getAdmissionNumber());
        }

        // Build update SQL (REMOVED TOTAL FEE COLUMNS)
        StringBuilder sqlBuilder = new StringBuilder();
        sqlBuilder.append(String.format("""
            UPDATE %s SET
                enquiry_key = ?, admission_number = ?, 
                student_name = ?, father_name = ?, mother_name = ?, street_village = ?, place_pincode = ?, 
                district = ?, phone_number = ?, phone_number2 = ?, boarding_point = ?, bus_route_number = ?, email_id = ?, 
                communication_address = ?, nationality = ?, religion = ?, state = ?, community = ?, caste = ?,
                student_type = ?, student_category = ?, standard = ?, section = ?, gender = ?, date_of_birth = ?, 
                emis = ?, lunch_refresh = ?, blood_group = ?, date_of_admission = ?, mother_tongue = ?, 
                father_occupation = ?, mother_occupation = ?, exam_number = ?,
                studied_year = ?, class_last_studied = ?, class_to_be_admitted = ?, 
                name_of_school = ?, remarks = ?, identification_mark1 = ?, identification_mark2 = ?, 
                aadhar_number = ?, qr_code_data = ?, academic_year = ?, updated_at = CURRENT_TIMESTAMP
        """, admissionTable));

        List<Object> paramsList = new java.util.ArrayList<>();

        // Add non-photo fields
        paramsList.add(dto.getEnquiryKey());
        paramsList.add(dto.getAdmissionNumber());
        paramsList.add(dto.getStudentName());
        paramsList.add(dto.getFatherName());
        paramsList.add(dto.getMotherName());
        paramsList.add(dto.getStreetVillage());
        paramsList.add(dto.getPlacePincode());
        paramsList.add(dto.getDistrict());
        paramsList.add(dto.getPhoneNumber());
        paramsList.add(dto.getPhoneNumber2());
        paramsList.add(dto.getBoardingPoint());
        paramsList.add(dto.getBusRouteNumber());
        paramsList.add(dto.getEmailId());
        paramsList.add(dto.getCommunicationAddress());
        paramsList.add(dto.getNationality());
        paramsList.add(dto.getReligion());
        paramsList.add(dto.getState());
        paramsList.add(dto.getCommunity());
        paramsList.add(dto.getCaste());
        paramsList.add(dto.getStudentType());
        paramsList.add(dto.getStudentCategory());
        paramsList.add(dto.getStandard());
        paramsList.add(dto.getSection());
        paramsList.add(dto.getGender());
        paramsList.add(dto.getDateOfBirth());
        paramsList.add(dto.getEmis());
        paramsList.add(dto.getLunchRefresh());
        paramsList.add(dto.getBloodGroup());
        paramsList.add(dto.getDateOfAdmission());
        paramsList.add(dto.getMotherTongue());
        paramsList.add(dto.getFatherOccupation());
        paramsList.add(dto.getMotherOccupation());
        paramsList.add(dto.getExamNumber());
        paramsList.add(dto.getStudiedYear());
        paramsList.add(dto.getClassLastStudied());
        paramsList.add(dto.getClassToBeAdmitted());
        paramsList.add(dto.getNameOfSchool());
        paramsList.add(dto.getRemarks());
        paramsList.add(dto.getIdentificationMark1());
        paramsList.add(dto.getIdentificationMark2());
        paramsList.add(dto.getAadharNumber());
        paramsList.add(dto.getQrCodeData());
        paramsList.add(dto.getAcademicYear());

        // Handle photo scenarios
        boolean hasNewPhoto = dto.getStudentPhotoFile() != null && !dto.getStudentPhotoFile().isEmpty();
        boolean removePhoto = dto.isRemoveExistingPhoto();

        if (hasNewPhoto) {
            sqlBuilder.append(", student_photo = ?, student_photo_content_type = ?");
            try {
                byte[] photoBytes = dto.getStudentPhotoFile().getBytes();
                String contentType = dto.getStudentPhotoFile().getContentType();
                paramsList.add(photoBytes);
                paramsList.add(contentType);
            } catch (IOException e) {
                throw new RuntimeException("Failed to process student photo", e);
            }
        } else if (removePhoto) {
            sqlBuilder.append(", student_photo = NULL, student_photo_content_type = NULL");
        }

        sqlBuilder.append(" WHERE id = ? AND school_id = ?");
        paramsList.add(id);
        paramsList.add(schoolId);

        String sql = sqlBuilder.toString();
        Object[] params = paramsList.toArray();

        int rows = jdbc.update(sql, params);
        log.info("✅ Updated admission ID: {} ({} rows affected)", id, rows);

        if (rows > 0) {
            // Update fee details - delete existing and insert new
            deleteFeeDetails(jdbc, schoolId, dto.getAdmissionNumber(), academicYear);
            insertTuitionFees(jdbc, schoolId, dto, dto.getTuitionFees());
            insertHostelFees(jdbc, schoolId, dto, dto.getHostelFees());
            insertTransportFee(jdbc, schoolId, dto, dto.getTransportFee());
        }

        return rows > 0 ? getAdmissionById(schoolId, id, academicYear) : Optional.empty();
    }

    private void deleteFeeDetails(JdbcTemplate jdbc, String schoolId, String admissionNumber, String academicYear) {
        String tuitionTable = getTuitionFeeTableName(academicYear);
        String hostelTable = getHostelFeeTableName(academicYear);
        String transportTable = getTransportFeeTableName(academicYear);

        jdbc.update(String.format("DELETE FROM %s WHERE admission_number = ? AND school_id = ?", tuitionTable),
                admissionNumber, schoolId);
        jdbc.update(String.format("DELETE FROM %s WHERE admission_number = ? AND school_id = ?", hostelTable),
                admissionNumber, schoolId);
        jdbc.update(String.format("DELETE FROM %s WHERE admission_number = ? AND school_id = ?", transportTable),
                admissionNumber, schoolId);

        log.info("✅ Deleted existing fee details for admission number: {}", admissionNumber);
    }

    public FeeDetailsResponse getAdmissionFeeDetails(String schoolId, Long admissionId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        FeeDetailsResponse response = new FeeDetailsResponse();

        // Retrieve admission_number first using admissionId
        String admissionTable = getAdmissionTableName(academicYear);
        String admissionNumber;
        try {
            admissionNumber = jdbc.queryForObject(
                    String.format("SELECT admission_number FROM %s WHERE id = ? AND school_id = ?", admissionTable),
                    String.class, admissionId, schoolId
            );
        } catch (EmptyResultDataAccessException e) {
            log.warn("Admission not found for fee details lookup. ID: {}", admissionId);
            return response;
        }

        // Get tuition fees
        String tuitionTable = getTuitionFeeTableName(academicYear);
        String tuitionSql = String.format("SELECT fee_heading, account_head, amount FROM %s WHERE admission_number = ? AND school_id = ?",
                tuitionTable);
        List<TuitionFeeDTO> tuitionFees = jdbc.query(tuitionSql, (rs, rowNum) -> {
            TuitionFeeDTO dto = new TuitionFeeDTO();
            dto.setFeeHeading(rs.getString("fee_heading"));
            dto.setAccountHead(rs.getString("account_head"));
            dto.setAmount(rs.getDouble("amount"));
            return dto;
        }, admissionNumber, schoolId);

        // Get hostel fees
        String hostelTable = getHostelFeeTableName(academicYear);
        String hostelSql = String.format("SELECT fee_heading, account_head, amount FROM %s WHERE admission_number = ? AND school_id = ?",
                hostelTable);
        List<HostelFeeDTO> hostelFees = jdbc.query(hostelSql, (rs, rowNum) -> {
            HostelFeeDTO dto = new HostelFeeDTO();
            dto.setFeeHeading(rs.getString("fee_heading"));
            dto.setAccountHead(rs.getString("account_head"));
            dto.setAmount(rs.getDouble("amount"));
            return dto;
        }, admissionNumber, schoolId);

        // Get transport fee
        String transportTable = getTransportFeeTableName(academicYear);
        String transportSql = String.format("SELECT fee_heading, account_head, amount, boarding_point, bus_route_number FROM %s WHERE admission_number = ? AND school_id = ?",
                transportTable);
        TransportFeeDTO transportFee = jdbc.query(transportSql, rs -> {
            if (rs.next()) {
                TransportFeeDTO dto = new TransportFeeDTO();
                dto.setFeeHeading(rs.getString("fee_heading"));
                dto.setAccountHead(rs.getString("account_head"));
                dto.setAmount(rs.getDouble("amount"));
                dto.setBoardingPoint(rs.getString("boarding_point"));
                dto.setBusRouteNumber(rs.getString("bus_route_number"));
                return dto;
            }
            return null;
        }, admissionNumber, schoolId);

        // Calculate totals
        Double totalTuitionFee = tuitionFees.stream().mapToDouble(TuitionFeeDTO::getAmount).sum();
        Double totalHostelFee = hostelFees.stream().mapToDouble(HostelFeeDTO::getAmount).sum();
        Double totalTransportFee = transportFee != null ? transportFee.getAmount() : 0.0;
        Double grandTotal = totalTuitionFee + totalHostelFee + totalTransportFee;

        response.setTuitionFees(tuitionFees);
        response.setHostelFees(hostelFees);
        response.setTransportFee(transportFee);
        response.setTotalTuitionFee(totalTuitionFee);
        response.setTotalHostelFee(totalHostelFee);
        response.setTotalTransportFee(totalTransportFee);
        response.setGrandTotal(grandTotal);

        return response;
    }

    public List<Admission> getAllAdmissions(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc, academicYear);
        try {
            String tableName = getAdmissionTableName(academicYear);
            String sql = String.format("SELECT * FROM %s WHERE school_id = ? AND academic_year = ? ORDER BY created_at DESC", tableName);
            List<Admission> admissions = jdbc.query(sql, new BeanPropertyRowMapper<>(Admission.class), schoolId, academicYear);
            log.info("📥 Retrieved {} admissions", admissions.size());
            return admissions;
        } catch (Exception e) {
            log.error("Error fetching admissions", e);
            throw new RuntimeException("Failed to fetch admissions: " + e.getMessage(), e);
        }
    }

    public Optional<Admission> getAdmissionById(String schoolId, Long id, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc, academicYear);
        try {
            String tableName = getAdmissionTableName(academicYear);
            String sql = String.format("SELECT * FROM %s WHERE id = ? AND school_id = ?", tableName);
            Admission admission = jdbc.queryForObject(sql, new BeanPropertyRowMapper<>(Admission.class), id, schoolId);
            return Optional.ofNullable(admission);
        } catch (EmptyResultDataAccessException e) {
            log.warn("Admission not found with id: {}", id);
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error fetching admission", e);
            throw new RuntimeException("Failed to fetch admission: " + e.getMessage(), e);
        }
    }

    public Optional<Admission> getAdmissionByAdmissionNumber(String schoolId, String admissionNumber, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc, academicYear);
        try {
            String tableName = getAdmissionTableName(academicYear);
            String sql = String.format("SELECT * FROM %s WHERE admission_number = ? AND school_id = ?", tableName);
            Admission admission = jdbc.queryForObject(sql, new BeanPropertyRowMapper<>(Admission.class), admissionNumber, schoolId);
            return Optional.ofNullable(admission);
        } catch (EmptyResultDataAccessException e) {
            log.warn("Admission not found with admission number: {}", admissionNumber);
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error fetching admission", e);
            throw new RuntimeException("Failed to fetch admission: " + e.getMessage(), e);
        }
    }

    public boolean deleteAdmission(String schoolId, Long id, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc, academicYear);
        String tableName = getAdmissionTableName(academicYear);
        int rows = jdbc.update(String.format("DELETE FROM %s WHERE id = ? AND school_id = ?", tableName), id, schoolId);
        log.info("🗑️ Deleted {} admission(s) with ID: {}", rows, id);
        return rows > 0;
    }

    public List<Admission> searchAdmissions(String schoolId, String term, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc, academicYear);
        String tableName = getAdmissionTableName(academicYear);
        String like = "%" + term + "%";
        String sql = String.format("""
            SELECT * FROM %s 
            WHERE school_id = ? AND academic_year = ?
            AND (student_name LIKE ? OR father_name LIKE ? OR mother_name LIKE ? 
                 OR phone_number LIKE ? OR phone_number2 LIKE ? OR admission_number LIKE ? OR standard LIKE ?)
            ORDER BY created_at DESC
        """, tableName);
        List<Admission> results = jdbc.query(sql, new BeanPropertyRowMapper<>(Admission.class),
                schoolId, academicYear, like, like, like, like, like, like, like);
        log.info("🔍 Found {} admissions matching term: '{}'", results.size(), term);
        return results;
    }

    public boolean checkAdmissionNumberExists(String schoolId, String admissionNumber, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTablesExist(jdbc, academicYear);
        String tableName = getAdmissionTableName(academicYear);
        Integer count = jdbc.queryForObject(
                String.format("SELECT COUNT(*) FROM %s WHERE admission_number = ? AND school_id = ?", tableName),
                Integer.class, admissionNumber, schoolId
        );
        boolean exists = count != null && count > 0;
        log.info("🔍 Admission number '{}' exists: {}", admissionNumber, exists);
        return exists;
    }

    public byte[] getStudentPhoto(String schoolId, Long admissionId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String tableName = getAdmissionTableName(academicYear);
        try {
            byte[] photo = jdbc.queryForObject(
                    String.format("SELECT student_photo FROM %s WHERE id = ? AND school_id = ?", tableName),
                    byte[].class, admissionId, schoolId
            );
            log.info("📷 Retrieved student photo for admission ID: {} - {} bytes", admissionId, photo != null ? photo.length : 0);
            return photo;
        } catch (EmptyResultDataAccessException e) {
            log.warn("No student photo found for admission ID: {}", admissionId);
            return null;
        }
    }

    public String getStudentPhotoContentType(String schoolId, Long admissionId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String tableName = getAdmissionTableName(academicYear);
        try {
            String contentType = jdbc.queryForObject(
                    String.format("SELECT student_photo_content_type FROM %s WHERE id = ? AND school_id = ?", tableName),
                    String.class, admissionId, schoolId
            );
            log.info("📷 Retrieved student photo content type for admission ID: {} - {}", admissionId, contentType);
            return contentType;
        } catch (EmptyResultDataAccessException e) {
            log.warn("No student photo content type found for admission ID: {}", admissionId);
            return null;
        }
    }

    public List<String> getAvailableAcademicYears(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        try {
            List<String> academicYears = jdbc.queryForList(
                            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'admissions_%'",
                            String.class, schoolId
                    ).stream()
                    .map(tableName -> tableName.replace("admissions_", ""))
                    .toList();
            log.info("📚 Found {} academic years for school: {}", academicYears.size(), schoolId);
            return academicYears;
        } catch (Exception e) {
            log.error("Error fetching available academic years", e);
            throw new RuntimeException("Failed to fetch academic years: " + e.getMessage(), e);
        }
    }

    private void deleteEnquiryByKey(String schoolId, String enquiryKey) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            Long enquiryId = jdbc.queryForObject(
                    "SELECT id FROM enquiries WHERE enquiry_key = ? AND school_id = ?",
                    Long.class, enquiryKey, schoolId
            );

            if (enquiryId != null) {
                boolean deleted = enquiryService.deleteEnquiry(schoolId, enquiryId);
                if (deleted) {
                    log.info("🗑️ Successfully deleted enquiry with key: {}", enquiryKey);
                }
            }
        } catch (Exception e) {
            log.error("❌ Error deleting enquiry with key: {}", enquiryKey, e);
        }
    }

    private Double calculateTotalTuitionFee(List<TuitionFeeDTO> tuitionFees) {
        if (tuitionFees == null || tuitionFees.isEmpty()) return 0.0;
        return tuitionFees.stream()
                .mapToDouble(fee -> fee.getAmount() != null ? fee.getAmount() : 0.0)
                .sum();
    }

    private Double calculateTotalHostelFee(List<HostelFeeDTO> hostelFees) {
        if (hostelFees == null || hostelFees.isEmpty()) return 0.0;
        return hostelFees.stream()
                .mapToDouble(fee -> fee.getAmount() != null ? fee.getAmount() : 0.0)
                .sum();
    }

    private void validateAdmissionDTO(AdmissionDTO dto) {
        if (isBlank(dto.getAdmissionNumber())) throw new RuntimeException("Admission number is required");
        if (isBlank(dto.getStudentName())) throw new RuntimeException("Student name is required");
        if (isBlank(dto.getFatherName())) throw new RuntimeException("Father name is required");
        if (isBlank(dto.getStandard())) throw new RuntimeException("Standard is required");
        if (isBlank(dto.getAcademicYear())) throw new RuntimeException("Academic year is required");

        log.info("✅ Admission DTO validation passed");
    }

    private boolean isBlank(String val) {
        return val == null || val.trim().isEmpty();
    }
}