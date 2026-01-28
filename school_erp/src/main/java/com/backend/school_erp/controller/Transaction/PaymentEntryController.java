package com.backend.school_erp.controller.Transaction;

import com.backend.school_erp.DTO.Transaction.PaymentEntryDTO;
import com.backend.school_erp.entity.Transaction.PaymentEntry;
import com.backend.school_erp.service.Transaction.PaymentEntryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/transaction/paymententry")
@RequiredArgsConstructor
@Slf4j
public class PaymentEntryController {

    private final PaymentEntryService paymentEntryService;

    /** Get last entry number */
    @GetMapping("/last-entry")
    public ResponseEntity<Map<String, Object>> getLastEntryNo(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            Integer lastEntryNo = paymentEntryService.getLastEntryNo(schoolId, academicYear);
            Map<String, Object> response = new HashMap<>();
            response.put("lastEntryNo", lastEntryNo);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting last entry number for school: {}", schoolId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Get count of entries */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getEntryCount(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            Integer count = paymentEntryService.getEntryCount(schoolId, academicYear);
            Map<String, Object> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting entry count for school: {}", schoolId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Save payment entry (creates both payment_entries and day_book) */
    @PostMapping("/save")
    public ResponseEntity<?> savePayment(@RequestBody PaymentEntryDTO paymentEntryDTO) {
        try {
            // Validate required fields
            if (paymentEntryDTO.getSchoolId() == null || paymentEntryDTO.getSchoolId().trim().isEmpty()) {
                throw new IllegalArgumentException("School ID is required");
            }
            if (paymentEntryDTO.getAcademicYear() == null || paymentEntryDTO.getAcademicYear().trim().isEmpty()) {
                throw new IllegalArgumentException("Academic Year is required");
            }
            if (paymentEntryDTO.getExpenseName() == null || paymentEntryDTO.getExpenseName().trim().isEmpty()) {
                throw new IllegalArgumentException("Expense Name is required");
            }
            if (paymentEntryDTO.getReceiverName() == null || paymentEntryDTO.getReceiverName().trim().isEmpty()) {
                throw new IllegalArgumentException("Receiver Name is required");
            }
            if (paymentEntryDTO.getAmount() == null || paymentEntryDTO.getAmount() <= 0) {
                throw new IllegalArgumentException("Valid Amount is required");
            }

            PaymentEntry paymentEntry = paymentEntryService.savePayment(
                    paymentEntryDTO.getSchoolId(),
                    paymentEntryDTO
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment saved successfully with day book entry");
            response.put("data", paymentEntry);
            response.put("transactionId", paymentEntry.getTransactionId());
            response.put("entryNo", paymentEntry.getEntryNo());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error saving payment", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /** Search by entry number */
    @GetMapping("/search-by-entryno")
    public ResponseEntity<?> searchByEntryNo(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam Integer entryNo) {
        try {
            PaymentEntry paymentEntry = paymentEntryService.searchByEntryNo(schoolId, academicYear, entryNo);
            if (paymentEntry != null) {
                return ResponseEntity.ok(paymentEntry);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Payment entry not found");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            log.error("Error searching payment by entryNo: {} for school: {}", entryNo, schoolId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Get payment history with day book details */
    @GetMapping("/history")
    public ResponseEntity<?> getPaymentHistory(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam Integer entryNo) {
        try {
            Map<String, Object> history = paymentEntryService.getPaymentHistory(
                    schoolId, academicYear, entryNo
            );
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error getting payment history: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Get all payments with day book references */
    @GetMapping("/all-with-daybook")
    public ResponseEntity<List<Map<String, Object>>> getAllPaymentsWithDayBook(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            List<Map<String, Object>> payments = paymentEntryService.getAllPaymentsWithDayBook(
                    schoolId, academicYear
            );
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            log.error("Error getting all payments for school: {}", schoolId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Get day book summary for payments */
    @GetMapping("/daybook-summary")
    public ResponseEntity<List<Map<String, Object>>> getDayBookSummary(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        try {
            List<Map<String, Object>> summary = paymentEntryService.getDayBookSummary(
                    schoolId, academicYear, fromDate, toDate
            );
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("Error getting day book summary for school: {}", schoolId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Update payment entry */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePayment(
            @PathVariable Long id,
            @RequestBody PaymentEntryDTO paymentEntryDTO) {
        try {
            if (paymentEntryDTO.getSchoolId() == null || paymentEntryDTO.getSchoolId().trim().isEmpty()) {
                throw new IllegalArgumentException("School ID is required");
            }

            Optional<PaymentEntry> updatedPayment = paymentEntryService.updatePayment(
                    paymentEntryDTO.getSchoolId(), id, paymentEntryDTO
            );

            if (updatedPayment.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Payment updated successfully (day book also updated)");
                response.put("data", updatedPayment.get());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Payment entry not found");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            log.error("Error updating payment id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /** Delete payment entry (also deletes day book entry) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePayment(
            @PathVariable Long id,
            @RequestParam String schoolId) {
        try {
            boolean deleted = paymentEntryService.deletePayment(schoolId, id);
            Map<String, Object> response = new HashMap<>();
            if (deleted) {
                response.put("success", true);
                response.put("message", "Payment and day book entry deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Payment entry not found");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            log.error("Error deleting payment id: {} for school: {}", id, schoolId, e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}