package com.backend.school_erp.controller.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.EnquiryDTO;
import com.backend.school_erp.entity.AdmissionMaster.Enquiry;
import com.backend.school_erp.service.AdmissionMaster.EnquiryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admissionmaster/enquiry")
@Slf4j
public class EnquiryController {

    private final EnquiryService enquiryService;
    private final ObjectMapper objectMapper;

    public EnquiryController(EnquiryService enquiryService, ObjectMapper objectMapper) {
        this.enquiryService = enquiryService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/with-photo")
    public ResponseEntity<?> createEnquiryWithPhoto(
            @RequestParam String schoolId,
            @RequestPart("enquiryData") String enquiryData,
            @RequestPart(value = "studentPhoto", required = false) MultipartFile studentPhoto) {
        try {
            log.info("📸 Creating enquiry with photo for school: {}", schoolId);

            EnquiryDTO enquiryDTO = objectMapper.readValue(enquiryData, EnquiryDTO.class);
            enquiryDTO.setSchoolId(schoolId);
            enquiryDTO.setStudentPhotoFile(studentPhoto);
            sanitizeEnquiryDTO(enquiryDTO);

            log.info("💰 Fee structure in request: {}", enquiryDTO.getFeeStructure());
            log.info("✅ Processed enquiry data for: {}", enquiryDTO.getStudentName());

            Enquiry created = enquiryService.createEnquiryWithPhoto(schoolId, enquiryDTO);
            return ResponseEntity.ok(created);

        } catch (Exception e) {
            log.error("❌ Error creating enquiry with photo", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/with-photo")
    public ResponseEntity<?> updateEnquiryWithPhoto(
            @PathVariable Long id,
            @RequestParam String schoolId,
            @RequestPart("enquiryData") String enquiryData,
            @RequestPart(value = "studentPhoto", required = false) MultipartFile studentPhoto,
            @RequestParam(value = "removeExistingPhoto", required = false) String removeExistingPhoto) {
        try {
            log.info("📸 Updating enquiry with photo for ID: {}, school: {}", id, schoolId);
            log.info("🔄 Remove existing photo flag: {}", removeExistingPhoto);

            EnquiryDTO dto = objectMapper.readValue(enquiryData, EnquiryDTO.class);
            dto.setSchoolId(schoolId);
            dto.setStudentPhotoFile(studentPhoto);
            dto.setRemoveExistingPhoto("true".equalsIgnoreCase(removeExistingPhoto));
            sanitizeEnquiryDTO(dto);

            log.info("💰 Fee structure in update request: {}", dto.getFeeStructure());

            Optional<Enquiry> updated = enquiryService.updateEnquiryWithPhoto(schoolId, id, dto);
            return updated.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            log.error("❌ Error updating enquiry with photo", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<?> getEnquiriesBySchool(
            @PathVariable String schoolId,
            @RequestParam String academicYear) {
        return ResponseEntity.ok(enquiryService.getAllEnquiries(schoolId, academicYear));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEnquiryById(@PathVariable Long id, @RequestParam String schoolId) {
        return enquiryService.getEnquiryById(schoolId, id)
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getStudentPhoto(
            @PathVariable Long id,
            @RequestParam String schoolId) {
        try {
            byte[] photo = enquiryService.getStudentPhoto(schoolId, id);
            String contentType = enquiryService.getStudentPhotoContentType(schoolId, id);

            if (photo == null) {
                return ResponseEntity.notFound().build();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    contentType != null ? contentType : MediaType.IMAGE_JPEG_VALUE));
            headers.setContentDispositionFormData("inline", "student-photo");

            return new ResponseEntity<>(photo, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error retrieving student photo", e);
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEnquiry(@PathVariable Long id, @RequestParam String schoolId) {
        boolean deleted = enquiryService.deleteEnquiry(schoolId, id);
        return deleted ? ResponseEntity.ok(Map.of("message", "Deleted")) : ResponseEntity.notFound().build();
    }

    @GetMapping("/school/{schoolId}/search")
    public ResponseEntity<?> search(
            @PathVariable String schoolId,
            @RequestParam String searchTerm,
            @RequestParam String academicYear) {
        return ResponseEntity.ok(enquiryService.searchEnquiries(schoolId, searchTerm, academicYear));
    }

    @GetMapping("/check-key")
    public ResponseEntity<?> checkKey(@RequestParam String schoolId, @RequestParam String enquiryKey) {
        return ResponseEntity.ok(enquiryService.checkEnquiryKeyExists(schoolId, enquiryKey));
    }

    private void sanitizeEnquiryDTO(EnquiryDTO dto) {
        if (dto.getBusFee() == null) dto.setBusFee("0.00");
        if (dto.getHostelFee() == null) dto.setHostelFee("0.00");
        if (dto.getTutionFees() == null) dto.setTutionFees("0.00");
        if (dto.getAcademicYear() == null) dto.setAcademicYear("2024-2025");
        if (dto.getFeeStructure() == null) dto.setFeeStructure("{}");

        // Ensure empty strings for optional fields
        if (dto.getAdmissionNumber() == null) dto.setAdmissionNumber("");
        if (dto.getBoardingPoint() == null) dto.setBoardingPoint("");
        if (dto.getBusRouteNumber() == null) dto.setBusRouteNumber("");
        if (dto.getLunchRefresh() == null) dto.setLunchRefresh("");
    }
}