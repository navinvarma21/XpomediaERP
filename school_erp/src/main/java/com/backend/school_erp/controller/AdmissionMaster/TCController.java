package com.backend.school_erp.controller.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.StudentTCProfileDTO;
import com.backend.school_erp.DTO.AdmissionMaster.TCRequestDTO;
import com.backend.school_erp.DTO.DebitCardReport.TCListResponseDTO;
import com.backend.school_erp.entity.AdmissionMaster.TransferCertificate;
import com.backend.school_erp.service.AdmissionMaster.TCService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tc")
@Slf4j
public class TCController {

    @Autowired
    private TCService tcService;

    @GetMapping("/student-profile/{admissionNumber}")
    public ResponseEntity<?> getStudentProfileForTC(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {

        try {
            log.info("Fetching TC profile for student: {}", admissionNumber);
            StudentTCProfileDTO profile = tcService.getStudentTCProfile(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Error fetching TC profile: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createTransferCertificate(
            @RequestBody TCRequestDTO request,
            @RequestParam String schoolId) {

        try {
            log.info("Creating TC for admission: {}", request.getAdmissionNumber());

            // Check if TC already exists for this student
            if (tcService.checkIfTCExists(schoolId, request.getAdmissionNumber(), request.getAcademicYear())) {
                return ResponseEntity.badRequest().body("TC already generated for this student. Cannot generate another TC.");
            }

            TransferCertificate result = tcService.generateTC(schoolId, request);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            log.error("TC generation blocked: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error creating TC", e);
            return ResponseEntity.badRequest().body("Failed to create TC: " + e.getMessage());
        }
    }

    @GetMapping("/check-tc-exists/{admissionNumber}")
    public ResponseEntity<Boolean> checkTCExists(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {

        try {
            boolean exists = tcService.checkIfTCExists(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            log.error("Error checking TC existence", e);
            return ResponseEntity.ok(false);
        }
    }

    @GetMapping("/list")
    public ResponseEntity<?> getTCList(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(required = false) String standard,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String search) {

        try {
            List<TCListResponseDTO> list = tcService.getGeneratedTCs(schoolId, academicYear, standard, section, search);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}