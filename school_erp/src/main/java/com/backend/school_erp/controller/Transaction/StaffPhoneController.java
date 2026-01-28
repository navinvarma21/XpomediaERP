package com.backend.school_erp.controller.Transaction;

import com.backend.school_erp.DTO.Transaction.StaffPhoneUpdateDTO;
import com.backend.school_erp.DTO.Transaction.StaffResponseDTO;
import com.backend.school_erp.service.Transaction.StaffPhoneService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transaction/staffphone")
@Slf4j
public class StaffPhoneController {

    @Autowired
    private StaffPhoneService staffPhoneService;

    /** Get staff list for dropdown */
    @GetMapping("/staff-list")
    public ResponseEntity<?> getStaffList(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            log.info("Fetching staff list for school: {}, academicYear: {}", schoolId, academicYear);

            List<StaffResponseDTO> staffList = staffPhoneService.getStaffList(schoolId, academicYear);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", staffList);
            response.put("message", "Staff list fetched successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error in getStaffList for school: {}", schoolId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /** Search staff by code or name */
    @GetMapping("/search")
    public ResponseEntity<?> searchStaff(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String searchTerm) {
        try {
            log.info("Searching staff for term: {} in school: {}", searchTerm, schoolId);

            List<StaffResponseDTO> staffList = staffPhoneService.searchStaff(schoolId, academicYear, searchTerm);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", staffList);
            response.put("message", "Staff search completed");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error in searchStaff for school: {}", schoolId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /** Update staff phone number */
    @PostMapping("/update-phone")
    public ResponseEntity<?> updatePhoneNumber(@RequestBody StaffPhoneUpdateDTO updateDTO) {
        try {
            log.info("Updating phone number for staff: {} in school: {}",
                    updateDTO.getStaffCode(), updateDTO.getSchoolId());

            boolean success = staffPhoneService.updateStaffPhone(
                    updateDTO.getSchoolId(),
                    updateDTO.getAcademicYear(),
                    updateDTO.getStaffCode(),
                    updateDTO.getNewPhoneNumber(),
                    updateDTO.getUpdatedBy()
            );

            if (success) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Phone number updated successfully");
                response.put("staffCode", updateDTO.getStaffCode());
                response.put("newPhoneNumber", updateDTO.getNewPhoneNumber());

                return ResponseEntity.ok(response);
            } else {
                throw new RuntimeException("Failed to update phone number");
            }

        } catch (Exception e) {
            log.error("Error updating phone number for staff: {}", updateDTO.getStaffCode(), e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("staffCode", updateDTO.getStaffCode());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /** Get staff details by staff code */
    @GetMapping("/staff-details")
    public ResponseEntity<?> getStaffDetails(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String staffCode) {
        try {
            log.info("Fetching staff details for code: {} in school: {}", staffCode, schoolId);

            var staffOpt = staffPhoneService.getStaffByCode(schoolId, academicYear, staffCode);

            Map<String, Object> response = new HashMap<>();
            if (staffOpt.isPresent()) {
                response.put("success", true);
                response.put("data", staffOpt.get());
                response.put("message", "Staff details fetched successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("data", null);
                response.put("message", "Staff not found");
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error fetching staff details for code: {}", staffCode, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("data", null);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}