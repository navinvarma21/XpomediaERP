package com.backend.school_erp.service.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.ReplaceDTO;
import com.backend.school_erp.entity.AdmissionMaster.Admission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Slf4j
public class ReplaceService {

    private final AdmissionService admissionService;

    public ReplaceService(AdmissionService admissionService) {
        this.admissionService = admissionService;
    }

    @Transactional
    public boolean replacePhoneNumber(ReplaceDTO replaceDTO) {
        String schoolId = replaceDTO.getSchoolId();
        String admissionNumber = replaceDTO.getAdmissionNumber();
        String academicYear = replaceDTO.getAcademicYear();
        String phoneNumberToUpdate = replaceDTO.getPhoneNumberToUpdate();
        String newPhoneNumber = replaceDTO.getNewPhoneNumber();

        try {
            // Get existing admission record
            Optional<Admission> existingAdmission = admissionService
                    .getAdmissionByAdmissionNumber(schoolId, admissionNumber, academicYear);

            if (existingAdmission.isEmpty()) {
                log.error("❌ Admission not found: {} for school: {}", admissionNumber, schoolId);
                throw new RuntimeException("Student with admission number " + admissionNumber + " not found");
            }

            Admission admission = existingAdmission.get();

            // Get current phone numbers based on which one we're updating
            String currentPhone = phoneNumberToUpdate.equals("phone1") ?
                    admission.getPhoneNumber() : admission.getPhoneNumber2();

            // Check if new phone is different from current
            if (newPhoneNumber.equals(currentPhone)) {
                log.warn("⚠️ New phone number is same as current for admission: {}", admissionNumber);
                throw new RuntimeException("New phone number must be different from current phone number");
            }

            // Check for duplicate phone number (check both phone fields)
            if (isPhoneNumberExists(schoolId, newPhoneNumber, academicYear, admissionNumber)) {
                log.warn("⚠️ Phone number already exists: {} for school: {}", newPhoneNumber, schoolId);
                throw new RuntimeException("Phone number " + newPhoneNumber + " is already assigned to another student");
            }

            // Update the appropriate phone number
            boolean updated = updatePhoneInDatabase(schoolId, admissionNumber, phoneNumberToUpdate, newPhoneNumber, academicYear);

            if (updated) {
                log.info("✅ Phone number {} replaced for admission {}: {} -> {}",
                        phoneNumberToUpdate, admissionNumber, currentPhone, newPhoneNumber);
            }

            return updated;

        } catch (Exception e) {
            log.error("❌ Error replacing phone number for admission: {}", admissionNumber, e);
            throw new RuntimeException("Failed to replace phone number: " + e.getMessage());
        }
    }

    @Transactional
    public boolean replaceSection(ReplaceDTO replaceDTO) {
        String schoolId = replaceDTO.getSchoolId();
        String admissionNumber = replaceDTO.getAdmissionNumber();
        String academicYear = replaceDTO.getAcademicYear();
        String newSection = replaceDTO.getSection();

        try {
            // Get existing admission record
            Optional<Admission> existingAdmission = admissionService
                    .getAdmissionByAdmissionNumber(schoolId, admissionNumber, academicYear);

            if (existingAdmission.isEmpty()) {
                log.error("❌ Admission not found: {} for school: {}", admissionNumber, schoolId);
                throw new RuntimeException("Student with admission number " + admissionNumber + " not found");
            }

            Admission admission = existingAdmission.get();
            String currentSection = admission.getSection();

            // Check if new section is different from current
            if (newSection != null && newSection.equals(currentSection)) {
                log.warn("⚠️ New section is same as current for admission: {}", admissionNumber);
                throw new RuntimeException("New section must be different from current section");
            }

            // Update section
            boolean updated = updateSectionInDatabase(schoolId, admissionNumber, newSection, academicYear);

            if (updated) {
                log.info("✅ Section replaced for admission {}: {} -> {}",
                        admissionNumber, currentSection, newSection);
            }

            return updated;

        } catch (Exception e) {
            log.error("❌ Error replacing section for admission: {}", admissionNumber, e);
            throw new RuntimeException("Failed to replace section: " + e.getMessage());
        }
    }

    private boolean isPhoneNumberExists(String schoolId, String phoneNumber, String academicYear, String excludeAdmissionNumber) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            String tableName = getTableName(academicYear);

            // Check both phone_number and phone_number2 fields for duplicates
            String sql = String.format(
                    "SELECT COUNT(*) FROM %s WHERE (phone_number = ? OR phone_number2 = ?) AND school_id = ? AND admission_number != ?",
                    tableName
            );

            Integer count = jdbc.queryForObject(sql, Integer.class, phoneNumber, phoneNumber, schoolId, excludeAdmissionNumber);
            return count != null && count > 0;

        } catch (Exception e) {
            log.error("❌ Error checking phone number existence: {}", phoneNumber, e);
            return false;
        }
    }

    private boolean updatePhoneInDatabase(String schoolId, String admissionNumber, String phoneNumberToUpdate, String newPhone, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            String tableName = getTableName(academicYear);

            String columnName = phoneNumberToUpdate.equals("phone1") ? "phone_number" : "phone_number2";

            String sql = String.format(
                    "UPDATE %s SET %s = ?, updated_at = CURRENT_TIMESTAMP WHERE admission_number = ? AND school_id = ?",
                    tableName, columnName
            );

            int rowsAffected = jdbc.update(sql, newPhone, admissionNumber, schoolId);
            return rowsAffected > 0;

        } catch (Exception e) {
            log.error("❌ Database error updating phone number {} for admission: {}", phoneNumberToUpdate, admissionNumber, e);
            throw new RuntimeException("Database update failed: " + e.getMessage());
        }
    }

    private boolean updateSectionInDatabase(String schoolId, String admissionNumber, String newSection, String academicYear) {
        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);
            String tableName = getTableName(academicYear);

            String sql = String.format(
                    "UPDATE %s SET section = ?, updated_at = CURRENT_TIMESTAMP WHERE admission_number = ? AND school_id = ?",
                    tableName
            );

            int rowsAffected = jdbc.update(sql, newSection, admissionNumber, schoolId);
            return rowsAffected > 0;

        } catch (Exception e) {
            log.error("❌ Database error updating section for admission: {}", admissionNumber, e);
            throw new RuntimeException("Database update failed: " + e.getMessage());
        }
    }

    private String getTableName(String academicYear) {
        String sanitizedYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");
        return "admissions_" + sanitizedYear;
    }

    // Get JdbcTemplate from AdmissionService
    private JdbcTemplate getJdbcTemplate(String schoolId) {
        try {
            // Use reflection to access AdmissionService's getJdbcTemplate method
            java.lang.reflect.Method method = admissionService.getClass().getMethod("getJdbcTemplate", String.class);
            return (JdbcTemplate) method.invoke(admissionService, schoolId);
        } catch (Exception e) {
            log.error("❌ Failed to get JdbcTemplate from AdmissionService", e);
            throw new RuntimeException("Database connection error");
        }
    }
}