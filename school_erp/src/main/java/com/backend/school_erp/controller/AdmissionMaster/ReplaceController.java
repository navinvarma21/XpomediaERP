package com.backend.school_erp.controller.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.ReplaceDTO;
import com.backend.school_erp.service.AdmissionMaster.ReplaceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admissionmaster/replace")
@Slf4j
public class ReplaceController {

    private final ReplaceService replaceService;

    public ReplaceController(ReplaceService replaceService) {
        this.replaceService = replaceService;
    }

    @PutMapping("/phone")
    public ResponseEntity<Map<String, Object>> replacePhoneNumber(@RequestBody ReplaceDTO replaceDTO) {
        Map<String, Object> response = new HashMap<>();

        try {
            log.info("📞 Phone replacement request for admission: {}, phone type: {}, school: {}",
                    replaceDTO.getAdmissionNumber(), replaceDTO.getPhoneNumberToUpdate(), replaceDTO.getSchoolId());

            // Manual validation
            String validationError = replaceDTO.validateForPhoneReplacement();
            if (validationError != null) {
                response.put("success", false);
                response.put("message", validationError);
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = replaceService.replacePhoneNumber(replaceDTO);

            if (success) {
                log.info("✅ Phone number {} replaced successfully for admission: {}",
                        replaceDTO.getPhoneNumberToUpdate(), replaceDTO.getAdmissionNumber());
                response.put("success", true);
                response.put("message", "Phone number updated successfully");
                response.put("phoneNumberUpdated", replaceDTO.getPhoneNumberToUpdate());
                return ResponseEntity.ok(response);
            } else {
                log.warn("❌ Phone number replacement failed for admission: {}",
                        replaceDTO.getAdmissionNumber());
                response.put("success", false);
                response.put("message", "Failed to update phone number");
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("❌ Error replacing phone number for admission: {}",
                    replaceDTO.getAdmissionNumber(), e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/section")
    public ResponseEntity<Map<String, Object>> replaceSection(@RequestBody ReplaceDTO replaceDTO) {
        Map<String, Object> response = new HashMap<>();

        try {
            log.info("📚 Section replacement request for admission: {}, school: {}",
                    replaceDTO.getAdmissionNumber(), replaceDTO.getSchoolId());

            // Manual validation
            String validationError = replaceDTO.validateForSectionReplacement();
            if (validationError != null) {
                response.put("success", false);
                response.put("message", validationError);
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = replaceService.replaceSection(replaceDTO);

            if (success) {
                log.info("✅ Section replaced successfully for admission: {}",
                        replaceDTO.getAdmissionNumber());
                response.put("success", true);
                response.put("message", "Section updated successfully");
                return ResponseEntity.ok(response);
            } else {
                log.warn("❌ Section replacement failed for admission: {}",
                        replaceDTO.getAdmissionNumber());
                response.put("success", false);
                response.put("message", "Failed to update section");
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("❌ Error replacing section for admission: {}",
                    replaceDTO.getAdmissionNumber(), e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}