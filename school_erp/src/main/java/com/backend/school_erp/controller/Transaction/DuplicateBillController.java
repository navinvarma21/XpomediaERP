package com.backend.school_erp.controller.Transaction;

import com.backend.school_erp.DTO.Transaction.DuplicateBillRequestDTO;
import com.backend.school_erp.DTO.Transaction.DuplicateBillResponseDTO;
import com.backend.school_erp.service.Transaction.DuplicateBillService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/transaction/duplicatebill")
@Slf4j
public class DuplicateBillController {

    private final DuplicateBillService duplicateBillService;

    public DuplicateBillController(DuplicateBillService duplicateBillService) {
        this.duplicateBillService = duplicateBillService;
    }

    /** Search Daily Fee Collection Entry */
    @GetMapping("/search-daily-fee-collection")
    public ResponseEntity<DuplicateBillResponseDTO> searchDailyFeeCollection(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String billNumber) {

        try {
            log.info("🔍 Searching daily fee collection entry: {} for school: {}, academic year: {}",
                    billNumber, schoolId, academicYear);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(DuplicateBillResponseDTO.error("School ID is required"));
            }
            if (academicYear == null || academicYear.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(DuplicateBillResponseDTO.error("Academic year is required"));
            }
            if (billNumber == null || billNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(DuplicateBillResponseDTO.error("Bill number is required"));
            }

            var dailyFeeCollection = duplicateBillService.searchDailyFeeCollection(schoolId, academicYear, billNumber);

            if (dailyFeeCollection == null) {
                log.warn("❌ Daily fee collection entry not found: {}", billNumber);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        DuplicateBillResponseDTO.error("Daily fee bill not found with number: " + billNumber)
                );
            }

            log.info("✅ Daily fee collection entry found: {}", billNumber);
            return ResponseEntity.ok(DuplicateBillResponseDTO.success(dailyFeeCollection));

        } catch (Exception e) {
            log.error("❌ Error searching daily fee collection entry: {}", billNumber, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    DuplicateBillResponseDTO.error("Failed to search daily fee bill: " + e.getMessage())
            );
        }
    }

    /** Search Miscellaneous Fee Entry */
    @GetMapping("/search-miscellaneous-fee")
    public ResponseEntity<DuplicateBillResponseDTO> searchMiscellaneousFeeEntry(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String billNumber) {

        try {
            log.info("🔍 Searching miscellaneous fee entry: {} for school: {}, academic year: {}",
                    billNumber, schoolId, academicYear);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(DuplicateBillResponseDTO.error("School ID is required"));
            }
            if (academicYear == null || academicYear.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(DuplicateBillResponseDTO.error("Academic year is required"));
            }
            if (billNumber == null || billNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(DuplicateBillResponseDTO.error("Bill number is required"));
            }

            var miscellaneousFeeEntry = duplicateBillService.searchMiscellaneousFeeEntry(schoolId, academicYear, billNumber);

            if (miscellaneousFeeEntry == null) {
                log.warn("❌ Miscellaneous fee entry not found: {}", billNumber);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        DuplicateBillResponseDTO.error("Other fee bill not found with number: " + billNumber)
                );
            }

            log.info("✅ Miscellaneous fee entry found: {}", billNumber);
            return ResponseEntity.ok(DuplicateBillResponseDTO.success(miscellaneousFeeEntry));

        } catch (Exception e) {
            log.error("❌ Error searching miscellaneous fee entry: {}", billNumber, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    DuplicateBillResponseDTO.error("Failed to search other fee bill: " + e.getMessage())
            );
        }
    }

    /** Combined search endpoint using request body */
    @PostMapping("/search")
    public ResponseEntity<DuplicateBillResponseDTO> searchBill(@RequestBody DuplicateBillRequestDTO request) {
        try {
            log.info("🔍 Searching bill: {} (Type: {}) for school: {}",
                    request.getBillNumber(), request.getBillType(), request.getSchoolId());

            String validationError = request.validate();
            if (validationError != null) {
                return ResponseEntity.badRequest().body(DuplicateBillResponseDTO.error(validationError));
            }

            Object result;
            if ("DailyFeeCollection".equals(request.getBillType())) {
                result = duplicateBillService.searchDailyFeeCollection(
                        request.getSchoolId(), request.getAcademicYear(), request.getBillNumber());
            } else if ("MiscellaneousFee".equals(request.getBillType())) {
                result = duplicateBillService.searchMiscellaneousFeeEntry(
                        request.getSchoolId(), request.getAcademicYear(), request.getBillNumber());
            } else {
                return ResponseEntity.badRequest().body(
                        DuplicateBillResponseDTO.error("Invalid bill type. Must be 'DailyFeeCollection' or 'MiscellaneousFee'")
                );
            }

            if (result == null) {
                String billTypeName = "DailyFeeCollection".equals(request.getBillType()) ? "Daily fee" : "Other fee";
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        DuplicateBillResponseDTO.error(billTypeName + " bill not found with number: " + request.getBillNumber())
                );
            }

            log.info("✅ Bill found: {}", request.getBillNumber());
            return ResponseEntity.ok(DuplicateBillResponseDTO.success(result));

        } catch (Exception e) {
            log.error("❌ Error searching bill: {}", request.getBillNumber(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    DuplicateBillResponseDTO.error("Failed to search bill: " + e.getMessage())
            );
        }
    }

    /** Health check endpoint */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck(@RequestParam String schoolId) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean healthy = duplicateBillService.healthCheck(schoolId);
            response.put("success", true);
            response.put("healthy", healthy);
            response.put("schoolId", schoolId);
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Health check failed for school {}: {}", schoolId, e.getMessage());
            response.put("success", false);
            response.put("healthy", false);
            response.put("error", e.getMessage());
            response.put("schoolId", schoolId);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}