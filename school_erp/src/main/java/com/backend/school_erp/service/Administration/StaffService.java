package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.StaffDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.Staff;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.dao.EmptyResultDataAccessException;

@Service
@Slf4j
public class StaffService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating DataSource for {}", id);
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            config.setMaximumPoolSize(10);
            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    private void ensureTableExists(JdbcTemplate jdbc) {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS staff (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                staff_code VARCHAR(100) NOT NULL,
                name VARCHAR(255),
                family_head_name VARCHAR(255),
                number_street_name VARCHAR(255),
                place_pin_code VARCHAR(50),
                state_id VARCHAR(50),
                state VARCHAR(255),
                district_id VARCHAR(50),
                district VARCHAR(255),
                gender VARCHAR(20),
                date_of_birth VARCHAR(50),
                community_id VARCHAR(50),
                community VARCHAR(255),
                caste_id VARCHAR(50),
                caste VARCHAR(255),
                religion_id VARCHAR(50),
                religion VARCHAR(255),
                nationality_id VARCHAR(50),
                nationality VARCHAR(255),
                designation_id VARCHAR(50),
                designation VARCHAR(255),
                education_qualification VARCHAR(255),
                salary VARCHAR(50),
                pf_number VARCHAR(100),
                category_id VARCHAR(50),
                category VARCHAR(255),
                marital_status VARCHAR(50),
                major_subject VARCHAR(255),
                optional_subject VARCHAR(255),
                extra_talent_dl_no VARCHAR(255),
                experience VARCHAR(255),
                class_in_charge_id VARCHAR(50),
                class_in_charge VARCHAR(255),
                date_of_joining VARCHAR(50),
                email_bank_ac_id VARCHAR(255),
                total_leave_days VARCHAR(50),
                mobile_number VARCHAR(20),
                status VARCHAR(50),
                date_of_relieve VARCHAR(50),
                school_id VARCHAR(50),
                academic_year VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_staff (staff_code, school_id, academic_year)
            )
        """);
    }

    public List<Staff> getAllStaff(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            return jdbc.query(
                    "SELECT * FROM staff WHERE school_id=? AND academic_year=? ORDER BY id DESC",
                    new BeanPropertyRowMapper<>(Staff.class),
                    schoolId, academicYear
            );
        } catch (Exception e) {
            log.warn("No staff found for school {} and academic year {}, returning empty list", schoolId, academicYear);
            return new ArrayList<>();
        }
    }

    // NEW: Get staff by ID directly
    public Optional<Staff> getStaffById(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            Staff staff = jdbc.queryForObject(
                    "SELECT * FROM staff WHERE id=? AND school_id=?",
                    new BeanPropertyRowMapper<>(Staff.class),
                    id, schoolId
            );
            return Optional.ofNullable(staff);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error fetching staff by ID: {}", e.getMessage());
            throw new RuntimeException("Error fetching staff: " + e.getMessage());
        }
    }

    public Staff addStaff(StaffDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(dto.getSchoolId());
        ensureTableExists(jdbc);

        int rows = jdbc.update("""
            INSERT INTO staff 
            (staff_code, name, family_head_name, number_street_name, place_pin_code, state_id, state, district_id, district,
             gender, date_of_birth, community_id, community, caste_id, caste, religion_id, religion, nationality_id, nationality,
             designation_id, designation, education_qualification, salary, pf_number, category_id, category, marital_status,
             major_subject, optional_subject, extra_talent_dl_no, experience, class_in_charge_id, class_in_charge, date_of_joining,
             email_bank_ac_id, total_leave_days, mobile_number, status, date_of_relieve, school_id, academic_year)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
                dto.getStaffCode(),
                dto.getName(),
                dto.getFamilyHeadName(),
                dto.getNumberStreetName(),
                dto.getPlacePinCode(),
                dto.getStateId(),
                dto.getState(),
                dto.getDistrictId(),
                dto.getDistrict(),
                dto.getGender(),
                dto.getDateOfBirth(),
                dto.getCommunityId(),
                dto.getCommunity(),
                dto.getCasteId(),
                dto.getCaste(),
                dto.getReligionId(),
                dto.getReligion(),
                dto.getNationalityId(),
                dto.getNationality(),
                dto.getDesignationId(),
                dto.getDesignation(),
                dto.getEducationQualification(),
                dto.getSalary(),
                dto.getPfNumber(),
                dto.getCategoryId(),
                dto.getCategory(),
                dto.getMaritalStatus(),
                dto.getMajorSubject(),
                dto.getOptionalSubject(),
                dto.getExtraTalentDlNo(),
                dto.getExperience(),
                dto.getClassInChargeId(),
                dto.getClassInCharge(),
                dto.getDateOfJoining(),
                dto.getEmailBankAcId(),
                dto.getTotalLeaveDays(),
                dto.getMobileNumber(),
                dto.getStatus(),
                dto.getDateOfRelieve(),
                dto.getSchoolId(),
                dto.getAcademicYear()
        );

        if (rows == 0) throw new RuntimeException("Failed to insert staff");

        Long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return jdbc.queryForObject("SELECT * FROM staff WHERE id=?", new BeanPropertyRowMapper<>(Staff.class), id);
    }

    public Optional<Staff> updateStaff(String schoolId, Long id, StaffDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        // DEBUG: Log the DTO values
        log.info("Updating staff with data - DistrictId: {}, District: {}", dto.getDistrictId(), dto.getDistrict());

        int rows = jdbc.update("""
            UPDATE staff SET 
            staff_code=?, name=?, family_head_name=?, number_street_name=?, place_pin_code=?, state_id=?, state=?, district_id=?, district=?,
            gender=?, date_of_birth=?, community_id=?, community=?, caste_id=?, caste=?, religion_id=?, religion=?, nationality_id=?, nationality=?,
            designation_id=?, designation=?, education_qualification=?, salary=?, pf_number=?, category_id=?, category=?, marital_status=?,
            major_subject=?, optional_subject=?, extra_talent_dl_no=?, experience=?, class_in_charge_id=?, class_in_charge=?, date_of_joining=?,
            email_bank_ac_id=?, total_leave_days=?, mobile_number=?, status=?, date_of_relieve=?, academic_year=?
            WHERE id=? AND school_id=?
        """,
                dto.getStaffCode(), dto.getName(), dto.getFamilyHeadName(), dto.getNumberStreetName(), dto.getPlacePinCode(),
                dto.getStateId(), dto.getState(), dto.getDistrictId(), dto.getDistrict(),
                dto.getGender(), dto.getDateOfBirth(), dto.getCommunityId(), dto.getCommunity(),
                dto.getCasteId(), dto.getCaste(), dto.getReligionId(), dto.getReligion(),
                dto.getNationalityId(), dto.getNationality(), dto.getDesignationId(), dto.getDesignation(),
                dto.getEducationQualification(), dto.getSalary(), dto.getPfNumber(), dto.getCategoryId(), dto.getCategory(),
                dto.getMaritalStatus(), dto.getMajorSubject(), dto.getOptionalSubject(), dto.getExtraTalentDlNo(),
                dto.getExperience(), dto.getClassInChargeId(), dto.getClassInCharge(), dto.getDateOfJoining(),
                dto.getEmailBankAcId(), dto.getTotalLeaveDays(), dto.getMobileNumber(), dto.getStatus(), dto.getDateOfRelieve(),
                dto.getAcademicYear(), id, schoolId
        );

        if (rows == 0) {
            log.warn("No staff found with ID: {} for school: {}", id, schoolId);
            return Optional.empty();
        }

        return Optional.ofNullable(jdbc.queryForObject("SELECT * FROM staff WHERE id=?", new BeanPropertyRowMapper<>(Staff.class), id));
    }

    public boolean deleteStaff(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM staff WHERE id=? AND school_id=?", id, schoolId);
        return rows > 0;
    }
}