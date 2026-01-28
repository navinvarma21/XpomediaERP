package com.backend.school_erp.controller.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.*;
import com.backend.school_erp.entity.AdmissionMaster.Admission;
import com.backend.school_erp.service.AdmissionMaster.AdmissionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admissionmaster/admission")
@Slf4j
public class AdmissionController {

    private final AdmissionService admissionService;
    private final ObjectMapper objectMapper;

    public AdmissionController(AdmissionService admissionService) {
        this.admissionService = admissionService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @PostMapping("/with-photo")
    public ResponseEntity<?> createAdmissionWithPhoto(
            @RequestParam("schoolId") String schoolId,
            @RequestParam("admissionData") String admissionDataJson,
            @RequestParam(value = "studentPhoto", required = false) MultipartFile studentPhoto,
            @RequestParam(value = "removeExistingPhoto", defaultValue = "false") boolean removeExistingPhoto) {

        try {
            log.info("📥 Received admission creation request for school: {}", schoolId);

            // Parse JSON and create DTO
            AdmissionDTO dto = parseAdmissionData(admissionDataJson);
            dto.setStudentPhotoFile(studentPhoto);
            dto.setRemoveExistingPhoto(removeExistingPhoto);
            dto.setSchoolId(schoolId);

            log.info("✅ Parsed admission data - Admission Number: {}", dto.getAdmissionNumber());
            log.info("✅ Student Name: {}", dto.getStudentName());
            log.info("💰 Fee Structure - Tuition: {} items, Hostel: {} items, Transport: {}",
                    dto.getTuitionFees() != null ? dto.getTuitionFees().size() : 0,
                    dto.getHostelFees() != null ? dto.getHostelFees().size() : 0,
                    dto.getTransportFee() != null ? "present" : "null");

            Admission admission = admissionService.createAdmissionWithPhoto(schoolId, dto);
            log.info("✅ Admission created successfully with ID: {}", admission.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(admission);

        } catch (Exception e) {
            log.error("❌ Error creating admission: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error creating admission: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/with-photo")
    public ResponseEntity<?> updateAdmissionWithPhoto(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId,
            @RequestParam("admissionData") String admissionDataJson,
            @RequestParam(value = "studentPhoto", required = false) MultipartFile studentPhoto,
            @RequestParam(value = "removeExistingPhoto", defaultValue = "false") boolean removeExistingPhoto) {

        try {
            log.info("📥 Received admission update request for ID: {}, school: {}", id, schoolId);

            // Parse JSON and create DTO
            AdmissionDTO dto = parseAdmissionData(admissionDataJson);
            dto.setStudentPhotoFile(studentPhoto);
            dto.setRemoveExistingPhoto(removeExistingPhoto);
            dto.setSchoolId(schoolId);

            Optional<Admission> updatedAdmission = admissionService.updateAdmissionWithPhoto(schoolId, id, dto);

            if (updatedAdmission.isPresent()) {
                log.info("✅ Admission updated successfully for ID: {}", id);
                return ResponseEntity.ok(updatedAdmission.get());
            } else {
                log.warn("❌ Admission not found for update: ID {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Admission not found with ID: " + id);
            }

        } catch (Exception e) {
            log.error("❌ Error updating admission: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error updating admission: " + e.getMessage());
        }
    }

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<?> getAllAdmissions(
            @PathVariable String schoolId,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📥 Fetching all admissions for school: {}, academic year: {}", schoolId, academicYear);
            List<Admission> admissions = admissionService.getAllAdmissions(schoolId, academicYear);
            return ResponseEntity.ok(admissions);
        } catch (Exception e) {
            log.error("❌ Error fetching admissions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching admissions: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAdmissionById(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📥 Fetching admission by ID: {} for school: {}, academic year: {}", id, schoolId, academicYear);
            Optional<Admission> admission = admissionService.getAdmissionById(schoolId, id, academicYear);

            if (admission.isPresent()) {
                return ResponseEntity.ok(admission.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Admission not found with ID: " + id);
            }
        } catch (Exception e) {
            log.error("❌ Error fetching admission: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching admission: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/fee-details")
    public ResponseEntity<?> getAdmissionFeeDetails(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📥 Fetching fee details for admission ID: {}", id);
            FeeDetailsResponse feeDetails = admissionService.getAdmissionFeeDetails(schoolId, id, academicYear);
            return ResponseEntity.ok(feeDetails);
        } catch (Exception e) {
            log.error("❌ Error fetching fee details: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching fee details: " + e.getMessage());
        }
    }

    @GetMapping("/admission-number/{admissionNumber}")
    public ResponseEntity<?> getAdmissionByAdmissionNumber(
            @PathVariable String admissionNumber,
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📥 Fetching admission by admission number: {}", admissionNumber);
            Optional<Admission> admission = admissionService.getAdmissionByAdmissionNumber(schoolId, admissionNumber, academicYear);

            if (admission.isPresent()) {
                return ResponseEntity.ok(admission.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Admission not found with admission number: " + admissionNumber);
            }
        } catch (Exception e) {
            log.error("❌ Error fetching admission: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching admission: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAdmission(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📥 Deleting admission with ID: {}", id);
            boolean deleted = admissionService.deleteAdmission(schoolId, id, academicYear);

            if (deleted) {
                return ResponseEntity.ok("Admission deleted successfully");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Admission not found with ID: " + id);
            }
        } catch (Exception e) {
            log.error("❌ Error deleting admission: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting admission: " + e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchAdmissions(
            @RequestParam("schoolId") String schoolId,
            @RequestParam("term") String term,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📥 Searching admissions for term: {}", term);
            List<Admission> admissions = admissionService.searchAdmissions(schoolId, term, academicYear);
            return ResponseEntity.ok(admissions);
        } catch (Exception e) {
            log.error("❌ Error searching admissions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error searching admissions: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getStudentPhoto(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📥 Fetching student photo for admission ID: {}", id);
            byte[] photoBytes = admissionService.getStudentPhoto(schoolId, id, academicYear);
            String contentType = admissionService.getStudentPhotoContentType(schoolId, id, academicYear);

            if (photoBytes != null && contentType != null) {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.parseMediaType(contentType));
                headers.setContentLength(photoBytes.length);
                return new ResponseEntity<>(photoBytes, headers, HttpStatus.OK);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            log.error("❌ Error fetching student photo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/check-admission-number")
    public ResponseEntity<Boolean> checkAdmissionNumberExists(
            @RequestParam("schoolId") String schoolId,
            @RequestParam("admissionNumber") String admissionNumber,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📥 Checking admission number: {}", admissionNumber);
            boolean exists = admissionService.checkAdmissionNumberExists(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            log.error("❌ Error checking admission number: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(false);
        }
    }

    @GetMapping("/academic-years/{schoolId}")
    public ResponseEntity<?> getAvailableAcademicYears(@PathVariable String schoolId) {
        try {
            log.info("📥 Fetching available academic years for school: {}", schoolId);
            List<String> academicYears = admissionService.getAvailableAcademicYears(schoolId);
            return ResponseEntity.ok(academicYears);
        } catch (Exception e) {
            log.error("❌ Error fetching academic years: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching academic years: " + e.getMessage());
        }
    }

    // Helper method to parse JSON string to AdmissionDTO
    private AdmissionDTO parseAdmissionData(String admissionDataJson) {
        try {
            log.info("🔄 Parsing admission data JSON...");
            AdmissionDTO dto = objectMapper.readValue(admissionDataJson, AdmissionDTO.class);
            log.info("✅ Successfully parsed admission data");
            log.info("📋 Admission Number: {}", dto.getAdmissionNumber());
            log.info("📋 Student Name: {}", dto.getStudentName());
            return dto;
        } catch (Exception e) {
            log.error("❌ Failed to parse admission data: {}", e.getMessage(), e);
            log.error("❌ Raw JSON: {}", admissionDataJson);
            throw new RuntimeException("Failed to parse admission data: " + e.getMessage(), e);
        }
    }
}