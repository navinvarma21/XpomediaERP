package com.backend.school_erp.controller.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.SchoolDetailsDTO;
import com.backend.school_erp.entity.AdmissionMaster.SchoolDetails;
import com.backend.school_erp.service.AdmissionMaster.SchoolDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/admissionmaster/school")
@RequiredArgsConstructor
@Slf4j
public class SchoolDetailsController {

    private final SchoolDetailsService schoolDetailsService;

    @GetMapping("/school-details")
    public ResponseEntity<?> getSchoolDetails(@RequestParam String schoolId) {
        try {
            log.info("📋 Fetching school details for school: {}", schoolId);

            Optional<SchoolDetails> schoolDetails = schoolDetailsService.getSchoolDetails(schoolId);

            if (schoolDetails.isPresent()) {
                log.info("✅ School details found for school: {}", schoolId);
                return ResponseEntity.ok(schoolDetails.get());
            } else {
                log.info("❌ No school details found for school: {}", schoolId);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("❌ Error fetching school details for school: {}", schoolId, e);
            return ResponseEntity.internalServerError()
                    .body("Error fetching school details: " + e.getMessage());
        }
    }

    @PostMapping("/school-details")
    public ResponseEntity<?> saveSchoolDetails(
            @RequestParam String schoolId,
            @RequestBody SchoolDetailsDTO schoolDetailsDTO) {
        try {
            log.info("💾 Saving school details for school: {}", schoolId);

            schoolDetailsService.validateSchoolDetails(schoolDetailsDTO);

            String username = "admin";

            SchoolDetails savedDetails = schoolDetailsService.saveSchoolDetails(schoolId, schoolDetailsDTO, username);

            log.info("✅ School details saved successfully for school: {}", schoolId);
            return ResponseEntity.ok(savedDetails);
        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Validation error for school details - school: {}, error: {}", schoolId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Error saving school details for school: {}", schoolId, e);
            return ResponseEntity.internalServerError()
                    .body("Error saving school details: " + e.getMessage());
        }
    }

    @DeleteMapping("/school-details")
    public ResponseEntity<?> deleteSchoolDetails(@RequestParam String schoolId) {
        try {
            log.info("🗑️ Deleting school details for school: {}", schoolId);

            boolean deleted = schoolDetailsService.deleteSchoolDetails(schoolId);

            if (deleted) {
                log.info("✅ School details deleted successfully for school: {}", schoolId);
                return ResponseEntity.ok().body("School details deleted successfully");
            } else {
                log.warn("⚠️ No school details found to delete for school: {}", schoolId);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("❌ Error deleting school details for school: {}", schoolId, e);
            return ResponseEntity.internalServerError()
                    .body("Error deleting school details: " + e.getMessage());
        }
    }
}