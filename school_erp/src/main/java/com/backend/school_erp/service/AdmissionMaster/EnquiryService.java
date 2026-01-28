package com.backend.school_erp.service.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.EnquiryDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.AdmissionMaster.Enquiry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.lob.DefaultLobHandler;
import org.springframework.jdbc.support.lob.LobHandler;
import org.springframework.stereotype.Service;
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
public class EnquiryService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();
    private final LobHandler lobHandler = new DefaultLobHandler();

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

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private void ensureTableExists(JdbcTemplate jdbc) {
        try {
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS enquiries (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    enquiry_key VARCHAR(100) NOT NULL UNIQUE,
                    admission_number VARCHAR(100),
                    student_photo MEDIUMBLOB,
                    student_photo_content_type VARCHAR(100),
                    student_name VARCHAR(255) NOT NULL,
                    father_name VARCHAR(255) NOT NULL,
                    mother_name VARCHAR(255) NOT NULL,
                    street_village VARCHAR(255),
                    place_pincode VARCHAR(20),
                    district VARCHAR(100),
                    phone_number VARCHAR(20) NOT NULL,
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
                    bus_fee DECIMAL(10,2) DEFAULT 0.00,
                    hostel_fee DECIMAL(10,2) DEFAULT 0.00,
                    tution_fees DECIMAL(10,2) DEFAULT 0.00,
                    studied_year VARCHAR(50),
                    class_last_studied VARCHAR(50),
                    class_to_be_admitted VARCHAR(50),
                    name_of_school VARCHAR(255),
                    remarks TEXT,
                    identification_mark1 VARCHAR(255),
                    identification_mark2 VARCHAR(255),
                    aadhar_number VARCHAR(20),
                    school_id VARCHAR(50) NOT NULL,
                    academic_year VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    fee_structure_json TEXT,  -- NEW: Store detailed fee structure with account heads
                    INDEX idx_enquiry_key (enquiry_key),
                    INDEX idx_student_name (student_name),
                    INDEX idx_phone_number (phone_number),
                    INDEX idx_standard (standard),
                    INDEX idx_school_academic (school_id, academic_year)
                )
            """);
            log.info("✅ Enquiries table ensured to exist with fee_structure_json column");
        } catch (Exception e) {
            log.error("❌ Failed to ensure enquiries table exists", e);
            throw new RuntimeException("Failed to initialize database table", e);
        }
    }

    public Enquiry createEnquiryWithPhoto(String schoolId, EnquiryDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        validateEnquiryDTO(dto);

        String sql = """
            INSERT INTO enquiries (
                enquiry_key, admission_number, student_photo, student_photo_content_type,
                student_name, father_name, mother_name, street_village, place_pincode,
                district, phone_number, boarding_point, bus_route_number, email_id,
                communication_address, nationality, religion, state, community, caste,
                student_type, student_category, standard, section, gender, date_of_birth,
                emis, lunch_refresh, blood_group, date_of_admission, mother_tongue,
                father_occupation, mother_occupation, exam_number, bus_fee, hostel_fee,
                tution_fees, studied_year, class_last_studied, class_to_be_admitted,
                name_of_school, remarks, identification_mark1, identification_mark2,
                aadhar_number, school_id, academic_year, fee_structure_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                     ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                     ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        // Handle file upload
        byte[] photoBytes = null;
        String contentType = null;

        if (dto.getStudentPhotoFile() != null && !dto.getStudentPhotoFile().isEmpty()) {
            try {
                photoBytes = dto.getStudentPhotoFile().getBytes();
                contentType = dto.getStudentPhotoFile().getContentType();
                log.info("📷 Processing photo file: {} bytes, type: {}",
                        photoBytes.length, contentType);
            } catch (IOException e) {
                log.error("❌ Error processing student photo file", e);
                throw new RuntimeException("Failed to process student photo", e);
            }
        }

        Object[] params = new Object[]{
                dto.getEnquiryKey(),            // 1
                dto.getAdmissionNumber(),       // 2
                photoBytes,                     // 3
                contentType,                    // 4
                dto.getStudentName(),           // 5
                dto.getFatherName(),            // 6
                dto.getMotherName(),            // 7
                dto.getStreetVillage(),         // 8
                dto.getPlacePincode(),          // 9
                dto.getDistrict(),              // 10
                dto.getPhoneNumber(),           // 11
                dto.getBoardingPoint(),         // 12
                dto.getBusRouteNumber(),        // 13
                dto.getEmailId(),               // 14
                dto.getCommunicationAddress(),  // 15
                dto.getNationality(),           // 16
                dto.getReligion(),              // 17
                dto.getState(),                 // 18
                dto.getCommunity(),             // 19
                dto.getCaste(),                 // 20
                dto.getStudentType(),           // 21
                dto.getStudentCategory(),       // 22
                dto.getStandard(),              // 23
                dto.getSection(),               // 24
                dto.getGender(),                // 25
                dto.getDateOfBirth(),           // 26
                dto.getEmis(),                  // 27
                dto.getLunchRefresh(),          // 28
                dto.getBloodGroup(),            // 29
                dto.getDateOfAdmission(),       // 30
                dto.getMotherTongue(),          // 31
                dto.getFatherOccupation(),      // 32
                dto.getMotherOccupation(),      // 33
                dto.getExamNumber(),            // 34
                parseFee(dto.getBusFee()),      // 35
                parseFee(dto.getHostelFee()),   // 36
                parseFee(dto.getTutionFees()),  // 37
                dto.getStudiedYear(),           // 38
                dto.getClassLastStudied(),      // 39
                dto.getClassToBeAdmitted(),     // 40
                dto.getNameOfSchool(),          // 41
                dto.getRemarks(),               // 42
                dto.getIdentificationMark1(),   // 43
                dto.getIdentificationMark2(),   // 44
                dto.getAadharNumber(),          // 45
                dto.getSchoolId(),              // 46
                dto.getAcademicYear(),          // 47
                dto.getFeeStructure()           // 48: NEW - Store fee structure with account heads
        };

        validateParameterCount(sql, params);

        try {
            jdbc.update(sql, params);
            log.info("✅ Enquiry created successfully for: {}", dto.getStudentName());
            log.info("💰 Fee structure stored: {}", dto.getFeeStructure());

            Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            return getEnquiryById(schoolId, lastId)
                    .orElseThrow(() -> new RuntimeException("Failed to retrieve created enquiry"));

        } catch (Exception e) {
            log.error("❌ Database error creating enquiry", e);
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }
    }

    // FIXED: Update method with proper photo handling and fee structure
    public Optional<Enquiry> updateEnquiryWithPhoto(String schoolId, Long id, EnquiryDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        validateEnquiryDTO(dto);

        Optional<Enquiry> existing = getEnquiryById(schoolId, id);
        if (existing.isEmpty()) {
            log.warn("❌ Enquiry not found for update: ID {}", id);
            return Optional.empty();
        }

        // Check for duplicate enquiry key
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM enquiries WHERE enquiry_key = ? AND school_id = ? AND id != ?",
                Integer.class, dto.getEnquiryKey(), schoolId, id
        );
        if (count != null && count > 0) {
            throw new RuntimeException("Enquiry key already exists: " + dto.getEnquiryKey());
        }

        // FIXED: Dynamic SQL based on photo update scenario
        StringBuilder sqlBuilder = new StringBuilder();
        sqlBuilder.append("""
            UPDATE enquiries SET
                enquiry_key = ?, admission_number = ?, 
                student_name = ?, father_name = ?, mother_name = ?, street_village = ?, place_pincode = ?, 
                district = ?, phone_number = ?, boarding_point = ?, bus_route_number = ?, email_id = ?, 
                communication_address = ?, nationality = ?, religion = ?, state = ?, community = ?, caste = ?,
                student_type = ?, student_category = ?, standard = ?, section = ?, gender = ?, date_of_birth = ?, 
                emis = ?, lunch_refresh = ?, blood_group = ?, date_of_admission = ?, mother_tongue = ?, 
                father_occupation = ?, mother_occupation = ?, exam_number = ?, bus_fee = ?, hostel_fee = ?, 
                tution_fees = ?, studied_year = ?, class_last_studied = ?, class_to_be_admitted = ?, 
                name_of_school = ?, remarks = ?, identification_mark1 = ?, identification_mark2 = ?, 
                aadhar_number = ?, academic_year = ?, fee_structure_json = ?, updated_at = CURRENT_TIMESTAMP
        """);

        List<Object> paramsList = new java.util.ArrayList<>();

        // Add non-photo fields first
        paramsList.add(dto.getEnquiryKey());
        paramsList.add(dto.getAdmissionNumber());
        paramsList.add(dto.getStudentName());
        paramsList.add(dto.getFatherName());
        paramsList.add(dto.getMotherName());
        paramsList.add(dto.getStreetVillage());
        paramsList.add(dto.getPlacePincode());
        paramsList.add(dto.getDistrict());
        paramsList.add(dto.getPhoneNumber());
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
        paramsList.add(parseFee(dto.getBusFee()));
        paramsList.add(parseFee(dto.getHostelFee()));
        paramsList.add(parseFee(dto.getTutionFees()));
        paramsList.add(dto.getStudiedYear());
        paramsList.add(dto.getClassLastStudied());
        paramsList.add(dto.getClassToBeAdmitted());
        paramsList.add(dto.getNameOfSchool());
        paramsList.add(dto.getRemarks());
        paramsList.add(dto.getIdentificationMark1());
        paramsList.add(dto.getIdentificationMark2());
        paramsList.add(dto.getAadharNumber());
        paramsList.add(dto.getAcademicYear());
        paramsList.add(dto.getFeeStructure()); // NEW: Store fee structure

        // FIXED: Handle photo scenarios
        boolean hasNewPhoto = dto.getStudentPhotoFile() != null && !dto.getStudentPhotoFile().isEmpty();
        boolean removePhoto = dto.isRemoveExistingPhoto();

        log.info("🔄 Photo update scenario - New photo: {}, Remove photo: {}", hasNewPhoto, removePhoto);

        if (hasNewPhoto) {
            // User uploaded a new photo - update both photo and content type
            sqlBuilder.append(", student_photo = ?, student_photo_content_type = ?");
            try {
                byte[] photoBytes = dto.getStudentPhotoFile().getBytes();
                String contentType = dto.getStudentPhotoFile().getContentType();
                paramsList.add(photoBytes);
                paramsList.add(contentType);
                log.info("📷 Adding new photo: {} bytes, type: {}", photoBytes.length, contentType);
            } catch (IOException e) {
                log.error("❌ Error processing new student photo file", e);
                throw new RuntimeException("Failed to process student photo", e);
            }
        } else if (removePhoto) {
            // User explicitly removed the photo - set both to null
            sqlBuilder.append(", student_photo = NULL, student_photo_content_type = NULL");
            log.info("🗑️ Removing existing photo as requested");
        }
        // If neither hasNewPhoto nor removePhoto is true, preserve existing photo (no changes to photo fields)

        sqlBuilder.append(" WHERE id = ? AND school_id = ?");
        paramsList.add(id);
        paramsList.add(schoolId);

        String sql = sqlBuilder.toString();
        Object[] params = paramsList.toArray();

        log.info("📝 Final SQL: {}", sql);
        log.info("🔢 Parameter count: {}", params.length);
        log.info("💰 Fee structure to store: {}", dto.getFeeStructure());

        validateParameterCount(sql, params);
        int rows = jdbc.update(sql, params);

        log.info("✅ Updated {} rows for enquiry ID: {}", rows, id);
        return rows > 0 ? getEnquiryById(schoolId, id) : Optional.empty();
    }

    public List<Enquiry> getAllEnquiries(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        try {
            String sql = "SELECT * FROM enquiries WHERE school_id = ? AND academic_year = ? ORDER BY created_at DESC";
            return jdbc.query(sql, new BeanPropertyRowMapper<>(Enquiry.class), schoolId, academicYear);
        } catch (Exception e) {
            log.error("Error fetching enquiries for school: {}", schoolId, e);
            throw new RuntimeException("Failed to fetch enquiries: " + e.getMessage(), e);
        }
    }

    public Optional<Enquiry> getEnquiryById(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        try {
            String sql = "SELECT * FROM enquiries WHERE id = ? AND school_id = ?";
            Enquiry enquiry = jdbc.queryForObject(sql, new BeanPropertyRowMapper<>(Enquiry.class), id, schoolId);
            return Optional.ofNullable(enquiry);
        } catch (EmptyResultDataAccessException e) {
            log.warn("Enquiry not found with id: {} for school: {}", id, schoolId);
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error fetching enquiry by id: {} for school: {}", id, schoolId, e);
            throw new RuntimeException("Failed to fetch enquiry: " + e.getMessage(), e);
        }
    }

    public boolean deleteEnquiry(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        int rows = jdbc.update("DELETE FROM enquiries WHERE id = ? AND school_id = ?", id, schoolId);
        return rows > 0;
    }

    public List<Enquiry> searchEnquiries(String schoolId, String term, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        String like = "%" + term + "%";
        String sql = """
            SELECT * FROM enquiries 
            WHERE school_id = ? AND academic_year = ?
            AND (student_name LIKE ? OR father_name LIKE ? OR mother_name LIKE ? 
                 OR phone_number LIKE ? OR enquiry_key LIKE ? OR standard LIKE ?)
            ORDER BY created_at DESC
        """;
        return jdbc.query(sql, new BeanPropertyRowMapper<>(Enquiry.class),
                schoolId, academicYear, like, like, like, like, like, like);
    }

    public boolean checkEnquiryKeyExists(String schoolId, String enquiryKey) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM enquiries WHERE enquiry_key = ? AND school_id = ?",
                Integer.class, enquiryKey, schoolId
        );
        return count != null && count > 0;
    }

    public byte[] getStudentPhoto(String schoolId, Long enquiryId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        try {
            return jdbc.queryForObject(
                    "SELECT student_photo FROM enquiries WHERE id = ? AND school_id = ?",
                    byte[].class, enquiryId, schoolId
            );
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public String getStudentPhotoContentType(String schoolId, Long enquiryId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        try {
            return jdbc.queryForObject(
                    "SELECT student_photo_content_type FROM enquiries WHERE id = ? AND school_id = ?",
                    String.class, enquiryId, schoolId
            );
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    private void validateEnquiryDTO(EnquiryDTO dto) {
        if (isBlank(dto.getEnquiryKey())) throw new RuntimeException("Enquiry key is required");
        if (isBlank(dto.getStudentName())) throw new RuntimeException("Student name is required");
        if (isBlank(dto.getFatherName())) throw new RuntimeException("Father name is required");
        if (isBlank(dto.getPhoneNumber())) throw new RuntimeException("Phone number is required");
        if (isBlank(dto.getStandard())) throw new RuntimeException("Standard is required");
    }

    private boolean isBlank(String val) {
        return val == null || val.trim().isEmpty();
    }

    private Double parseFee(String fee) {
        if (isBlank(fee)) return 0.0;
        try {
            return Double.parseDouble(fee);
        } catch (NumberFormatException e) {
            log.warn("Invalid fee format: {}, using 0.0", fee);
            return 0.0;
        }
    }

    private void validateParameterCount(String sql, Object[] params) {
        int placeholders = (int) sql.chars().filter(ch -> ch == '?').count();
        if (placeholders != params.length) {
            throw new RuntimeException("SQL expects " + placeholders +
                    " params but got " + params.length + ". SQL: " + sql);
        }
        log.info("✅ Parameter validation passed: {} placeholders, {} parameters", placeholders, params.length);
    }
}