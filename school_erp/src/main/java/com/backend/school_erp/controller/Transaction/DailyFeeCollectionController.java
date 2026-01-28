package com.backend.school_erp.controller.Transaction;

import com.backend.school_erp.DTO.Transaction.DailyFeeCollectionDTO;
import com.backend.school_erp.entity.Transaction.DailyFeeCollection;
import com.backend.school_erp.entity.Transaction.DayBook;
import com.backend.school_erp.service.Transaction.DailyFeeCollectionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transaction/daily-fee-collection")
@Slf4j
public class DailyFeeCollectionController {

    @Autowired
    private DailyFeeCollectionService dailyFeeCollectionService;

    @PostMapping("/process-payment")
    public ResponseEntity<?> processPayment(
            @RequestBody DailyFeeCollectionDTO dailyFeeCollectionDTO,
            @RequestParam String schoolId) {
        try {
            log.info("Processing payment for bill number: {}, school: {}", dailyFeeCollectionDTO.getBillNumber(), schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            // Validate required fields
            if (dailyFeeCollectionDTO.getBillNumber() == null || dailyFeeCollectionDTO.getBillNumber().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Bill number is required"));
            }
            if (dailyFeeCollectionDTO.getAdmissionNumber() == null || dailyFeeCollectionDTO.getAdmissionNumber().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Admission number is required"));
            }
            if (dailyFeeCollectionDTO.getFeePayments() == null || dailyFeeCollectionDTO.getFeePayments().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "At least one fee payment is required"));
            }

            DailyFeeCollection result = dailyFeeCollectionService.processPayment(schoolId, dailyFeeCollectionDTO);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error processing payment for bill {}: {}",
                    dailyFeeCollectionDTO.getBillNumber(), e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to process payment: " + e.getMessage(),
                    "billNumber", dailyFeeCollectionDTO.getBillNumber()
            ));
        }
    }

    @GetMapping("/fee-details/{admissionNumber}")
    public ResponseEntity<?> getFeeDetails(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            log.info("Fetching fee details for admission number: {}, school: {}, year: {}",
                    admissionNumber, schoolId, academicYear);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }
            if (academicYear == null || academicYear.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Academic year is required"));
            }

            Map<String, Object> feeDetails = dailyFeeCollectionService.getStudentFeeDetails(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(feeDetails);
        } catch (Exception e) {
            log.error("Error fetching fee details: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch fee details: " + e.getMessage()));
        }
    }

    @GetMapping("/payment-history/{admissionNumber}")
    public ResponseEntity<?> getPaymentHistory(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId) {
        try {
            log.info("Fetching payment history for admission number: {}, school: {}", admissionNumber, schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }
            if (admissionNumber == null || admissionNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Admission number is required"));
            }

            List<Map<String, Object>> paymentHistory = dailyFeeCollectionService.getPaymentHistory(schoolId, admissionNumber);

            if (paymentHistory.isEmpty()) {
                log.info("No payment history found for admission number: {}", admissionNumber);
                return ResponseEntity.ok(List.of());
            }

            log.info("Successfully retrieved {} payment history records for admission number: {}",
                    paymentHistory.size(), admissionNumber);
            return ResponseEntity.ok(paymentHistory);
        } catch (Exception e) {
            log.error("Error fetching payment history for admission number {}: {}", admissionNumber, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch payment history: " + e.getMessage()));
        }
    }

    @GetMapping("/last-bill-number")
    public ResponseEntity<?> getLastBillNumber(@RequestParam String schoolId) {
        try {
            log.info("Fetching last bill number for school: {}", schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            Map<String, String> result = dailyFeeCollectionService.getLastBillNumber(schoolId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching last bill number: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch last bill number: " + e.getMessage()));
        }
    }

    @GetMapping("/school")
    public ResponseEntity<?> getBillingEntriesBySchool(
            @RequestParam String schoolId,
            @RequestParam(required = false) String academicYear) {
        try {
            log.info("Fetching billing entries for school: {}", schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            List<DailyFeeCollection> billingEntries = dailyFeeCollectionService.getBillingEntriesBySchool(schoolId, academicYear);
            return ResponseEntity.ok(billingEntries);
        } catch (Exception e) {
            log.error("Error fetching billing entries: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch billing entries: " + e.getMessage()));
        }
    }

    @GetMapping("/admission/{admissionNumber}")
    public ResponseEntity<?> getBillingEntriesByAdmissionNumber(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId,
            @RequestParam(required = false) String academicYear) {
        try {
            log.info("Fetching billing entries for admission number: {}", admissionNumber);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            List<DailyFeeCollection> billingEntries = dailyFeeCollectionService.getBillingEntriesByAdmissionNumber(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(billingEntries);
        } catch (Exception e) {
            log.error("Error fetching billing entries: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch billing entries: " + e.getMessage()));
        }
    }

    @GetMapping("/day-book")
    public ResponseEntity<?> getDayBookEntries(
            @RequestParam String schoolId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            log.info("Fetching day book entries for school: {}", schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            List<DayBook> dayBookEntries = dailyFeeCollectionService.getDayBookEntries(schoolId, startDate, endDate);
            return ResponseEntity.ok(dayBookEntries);
        } catch (Exception e) {
            log.error("Error fetching day book entries: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch day book entries: " + e.getMessage()));
        }
    }

    @GetMapping("/total-paid/{admissionNumber}")
    public ResponseEntity<?> getTotalPaidAmount(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            log.info("Fetching total paid amount for admission number: {}, school: {}", admissionNumber, schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            Double totalPaid = dailyFeeCollectionService.getTotalPaidAmount(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(Map.of("totalPaid", totalPaid));
        } catch (Exception e) {
            log.error("Error fetching total paid amount: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch total paid amount: " + e.getMessage()));
        }
    }

    @GetMapping("/payment-history-detailed/{admissionNumber}")
    public ResponseEntity<?> getPaymentHistoryDetailed(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId) {
        try {
            log.info("Fetching detailed payment history for admission number: {}, school: {}", admissionNumber, schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            List<Map<String, Object>> paymentHistory = dailyFeeCollectionService.getPaymentHistoryDetailed(schoolId, admissionNumber);

            if (paymentHistory.isEmpty()) {
                log.info("No payment history found for admission number: {}", admissionNumber);
                return ResponseEntity.ok(List.of());
            }

            log.info("Successfully retrieved {} detailed payment history records for admission number: {}",
                    paymentHistory.size(), admissionNumber);
            return ResponseEntity.ok(paymentHistory);
        } catch (Exception e) {
            log.error("Error fetching detailed payment history for admission number {}: {}", admissionNumber, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch payment history: " + e.getMessage()));
        }
    }
}