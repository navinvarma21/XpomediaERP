package com.backend.school_erp.controller.Transaction;

import com.backend.school_erp.DTO.Transaction.ReceiptEntryDTO;
import com.backend.school_erp.entity.Transaction.ReceiptEntry;
import com.backend.school_erp.service.Transaction.ReceiptEntryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/transaction/receiptentry")
@Slf4j
public class ReceiptEntryController {

    @Autowired
    private ReceiptEntryService receiptEntryService;

    /** Get last receipt number */
    @GetMapping("/last-receipt")
    public ResponseEntity<Map<String, Object>> getLastReceiptNo(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            String lastReceiptNo = receiptEntryService.getLastReceiptNo(schoolId, academicYear);
            Map<String, Object> response = Map.of(
                    "lastReceiptNo", lastReceiptNo,
                    "success", true
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting last receipt number for school: {}, academicYear: {}", schoolId, academicYear, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Get count of receipts */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getReceiptCount(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            Integer count = receiptEntryService.getReceiptCount(schoolId, academicYear);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "count", count
            ));
        } catch (Exception e) {
            log.error("Error getting receipt count for school: {}, academicYear: {}", schoolId, academicYear, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Save receipt entry (creates both receipt_entries and day_book) */
    @PostMapping("/save")
    public ResponseEntity<?> saveReceipt(@RequestBody ReceiptEntryDTO receiptEntryDTO) {
        try {
            log.info("Saving receipt entry: {}", receiptEntryDTO);

            // Validate required fields
            if (receiptEntryDTO.getSchoolId() == null || receiptEntryDTO.getSchoolId().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "School ID is required"
                ));
            }

            if (receiptEntryDTO.getAcademicYear() == null || receiptEntryDTO.getAcademicYear().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Academic Year is required"
                ));
            }

            if (receiptEntryDTO.getCategory() == null || receiptEntryDTO.getCategory().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Category (Main Head) is required"
                ));
            }

            if (receiptEntryDTO.getPersonName() == null || receiptEntryDTO.getPersonName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Person Name is required"
                ));
            }

            if (receiptEntryDTO.getAmount() == null || receiptEntryDTO.getAmount() <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Valid Amount is required"
                ));
            }

            ReceiptEntry savedReceipt = receiptEntryService.saveReceipt(
                    receiptEntryDTO.getSchoolId(),
                    receiptEntryDTO
            );

            // FIX: Removed transactionId from Map.of because it is now null
            Map<String, Object> response = Map.of(
                    "success", true,
                    "message", "Receipt saved successfully with day book entry.",
                    "receipt", savedReceipt,
                    "receiptNo", savedReceipt.getReceiptNo()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error saving receipt entry: {}", receiptEntryDTO, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "Failed to save receipt: " + e.getMessage()
            ));
        }
    }

    /** Search receipt by receipt number */
    @GetMapping("/search-by-receiptno")
    public ResponseEntity<?> searchByReceiptNo(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String receiptNo) {
        try {
            log.info("Searching receipt: schoolId={}, academicYear={}, receiptNo={}",
                    schoolId, academicYear, receiptNo);

            if (receiptNo == null || receiptNo.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Receipt number is required"
                ));
            }

            String formattedReceiptNo = receiptNo.trim();
            if (!formattedReceiptNo.toUpperCase().startsWith("IN")) {
                formattedReceiptNo = "In" + formattedReceiptNo;
            }

            ReceiptEntry receipt = receiptEntryService.searchByReceiptNo(
                    schoolId, academicYear, formattedReceiptNo);

            if (receipt != null) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "receipt", receipt
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "message", "Receipt not found",
                        "searchedReceiptNo", formattedReceiptNo
                ));
            }
        } catch (Exception e) {
            log.error("Error searching receipt by receiptNo: {} for school: {}", receiptNo, schoolId, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "Failed to search receipt: " + e.getMessage()
            ));
        }
    }

    /** Get sub heads for a specific main head */
    @GetMapping("/subheads-for-mainhead")
    public ResponseEntity<?> getSubHeadsForMainHead(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String mainHead) {
        try {
            List<String> subHeads = receiptEntryService.getSubHeadsForMainHead(schoolId, academicYear, mainHead);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "mainHead", mainHead,
                    "subHeads", subHeads
            ));
        } catch (Exception e) {
            log.error("Error getting sub heads for main head: {}", mainHead, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "Failed to get sub heads: " + e.getMessage()
            ));
        }
    }

    /** Get receipt history */
    @GetMapping("/history")
    public ResponseEntity<?> getReceiptHistory(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String receiptNo) {
        try {
            Map<String, Object> history = receiptEntryService.getReceiptHistory(
                    schoolId, academicYear, receiptNo
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "history", history
            ));
        } catch (Exception e) {
            log.error("Error getting receipt history: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Get all receipts with day book references */
    @GetMapping("/all-with-daybook")
    public ResponseEntity<?> getAllReceiptsWithDayBook(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            List<Map<String, Object>> receipts = receiptEntryService.getAllReceiptsWithDayBook(
                    schoolId, academicYear
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "receipts", receipts
            ));
        } catch (Exception e) {
            log.error("Error getting all receipts for school: {}", schoolId, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Get day book summary for receipts */
    @GetMapping("/daybook-summary")
    public ResponseEntity<?> getDayBookSummary(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        try {
            List<Map<String, Object>> summary = receiptEntryService.getDayBookSummary(
                    schoolId, academicYear, fromDate, toDate
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "summary", summary
            ));
        } catch (Exception e) {
            log.error("Error getting day book summary for school: {}", schoolId, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Get receipt categories from day_book */
    @GetMapping("/categories")
    public ResponseEntity<?> getReceiptCategories(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            List<String> categories = receiptEntryService.getReceiptCategories(schoolId, academicYear);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "categories", categories
            ));
        } catch (Exception e) {
            log.error("Error getting receipt categories: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Get receipt summary by category and account_head */
    @GetMapping("/summary-by-category")
    public ResponseEntity<?> getReceiptSummaryByCategory(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        try {
            List<Map<String, Object>> summary = receiptEntryService.getReceiptSummaryByCategory(
                    schoolId, academicYear, fromDate, toDate
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "summary", summary
            ));
        } catch (Exception e) {
            log.error("Error getting receipt summary by category: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Update receipt entry */
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateReceipt(
            @PathVariable Long id,
            @RequestBody ReceiptEntryDTO receiptEntryDTO) {
        try {
            if (receiptEntryDTO.getSchoolId() == null || receiptEntryDTO.getSchoolId().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "School ID is required"
                ));
            }

            Optional<ReceiptEntry> updatedReceipt = receiptEntryService.updateReceipt(
                    receiptEntryDTO.getSchoolId(), id, receiptEntryDTO
            );

            if (updatedReceipt.isPresent()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Receipt updated successfully",
                        "receipt", updatedReceipt.get()
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "message", "Receipt entry not found"
                ));
            }
        } catch (Exception e) {
            log.error("Error updating receipt with id: {} for school: {}", id, receiptEntryDTO.getSchoolId(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "Failed to update receipt: " + e.getMessage()
            ));
        }
    }

    /** Delete receipt entry */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteReceipt(
            @PathVariable Long id,
            @RequestParam String schoolId) {
        try {
            boolean deleted = receiptEntryService.deleteReceipt(schoolId, id);
            if (deleted) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Receipt and day book entry deleted successfully"
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "message", "Receipt entry not found"
                ));
            }
        } catch (Exception e) {
            log.error("Error deleting receipt with id: {} for school: {}", id, schoolId, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "Failed to delete receipt: " + e.getMessage()
            ));
        }
    }

    /** Health check endpoint */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "Receipt Entry Service is running",
                "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }
}