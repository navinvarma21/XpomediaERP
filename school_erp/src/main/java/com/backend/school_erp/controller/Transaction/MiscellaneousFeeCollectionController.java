package com.backend.school_erp.controller.Transaction;

import com.backend.school_erp.DTO.Transaction.MiscellaneousFeeCollectionDTO;
import com.backend.school_erp.entity.Transaction.MiscellaneousFeeCollection;
import com.backend.school_erp.entity.Transaction.DayBookMFC;
import com.backend.school_erp.service.Transaction.MiscellaneousFeeCollectionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transaction/otherfee")
@Slf4j
public class MiscellaneousFeeCollectionController {

    @Autowired
    private MiscellaneousFeeCollectionService miscellaneousFeeCollectionService;

    @PostMapping("/process-payment")
    public ResponseEntity<?> processPayment(
            @RequestBody MiscellaneousFeeCollectionDTO miscellaneousFeeCollectionDTO,
            @RequestParam String schoolId) {
        try {
            log.info("Processing other fee payment for bill number: {}, school: {}", miscellaneousFeeCollectionDTO.getBillNumber(), schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            if (miscellaneousFeeCollectionDTO.getBillNumber() == null || miscellaneousFeeCollectionDTO.getBillNumber().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Bill number is required"));
            }
            if (miscellaneousFeeCollectionDTO.getAdmissionNumber() == null || miscellaneousFeeCollectionDTO.getAdmissionNumber().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Admission number is required"));
            }
            if (miscellaneousFeeCollectionDTO.getFeePayments() == null || miscellaneousFeeCollectionDTO.getFeePayments().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "At least one fee payment is required"));
            }

            MiscellaneousFeeCollection result = miscellaneousFeeCollectionService.processPayment(schoolId, miscellaneousFeeCollectionDTO);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error processing other fee payment for bill {}: {}",
                    miscellaneousFeeCollectionDTO.getBillNumber(), e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to process payment: " + e.getMessage(),
                    "billNumber", miscellaneousFeeCollectionDTO.getBillNumber()
            ));
        }
    }

    @GetMapping("/fee-details/{admissionNumber}")
    public ResponseEntity<?> getFeeDetails(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            log.info("Fetching other fee details for admission number: {}, school: {}, year: {}",
                    admissionNumber, schoolId, academicYear);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }
            if (academicYear == null || academicYear.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Academic year is required"));
            }

            Map<String, Object> feeDetails = miscellaneousFeeCollectionService.getStudentFeeDetails(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(feeDetails);
        } catch (Exception e) {
            log.error("Error fetching other fee details: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch fee details: " + e.getMessage()));
        }
    }

    @GetMapping("/payment-history/{admissionNumber}")
    public ResponseEntity<?> getPaymentHistory(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId) {
        try {
            log.info("Fetching other fee payment history for admission number: {}, school: {}", admissionNumber, schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }
            if (admissionNumber == null || admissionNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Admission number is required"));
            }

            List<Map<String, Object>> paymentHistory = miscellaneousFeeCollectionService.getPaymentHistory(schoolId, admissionNumber);

            if (paymentHistory.isEmpty()) {
                log.info("No other fee payment history found for admission number: {}", admissionNumber);
                return ResponseEntity.ok(List.of());
            }

            log.info("Successfully retrieved {} other fee payment history records for admission number: {}",
                    paymentHistory.size(), admissionNumber);
            return ResponseEntity.ok(paymentHistory);
        } catch (Exception e) {
            log.error("Error fetching other fee payment history for admission number {}: {}", admissionNumber, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch payment history: " + e.getMessage()));
        }
    }

    @GetMapping("/last-bill-number")
    public ResponseEntity<?> getLastBillNumber(@RequestParam String schoolId) {
        try {
            log.info("Fetching last other fee bill number for school: {}", schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            Map<String, String> result = miscellaneousFeeCollectionService.getLastBillNumber(schoolId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching last other fee bill number: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch last bill number: " + e.getMessage()));
        }
    }

    @GetMapping("/school")
    public ResponseEntity<?> getBillingEntriesBySchool(
            @RequestParam String schoolId,
            @RequestParam(required = false) String academicYear) {
        try {
            log.info("Fetching other fee billing entries for school: {}", schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            List<MiscellaneousFeeCollection> billingEntries = miscellaneousFeeCollectionService.getBillingEntriesBySchool(schoolId, academicYear);
            return ResponseEntity.ok(billingEntries);
        } catch (Exception e) {
            log.error("Error fetching other fee billing entries: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch billing entries: " + e.getMessage()));
        }
    }

    @GetMapping("/admission/{admissionNumber}")
    public ResponseEntity<?> getBillingEntriesByAdmissionNumber(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId,
            @RequestParam(required = false) String academicYear) {
        try {
            log.info("Fetching other fee billing entries for admission number: {}", admissionNumber);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            List<MiscellaneousFeeCollection> billingEntries = miscellaneousFeeCollectionService.getBillingEntriesByAdmissionNumber(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(billingEntries);
        } catch (Exception e) {
            log.error("Error fetching other fee billing entries: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch billing entries: " + e.getMessage()));
        }
    }

    @GetMapping("/day-book")
    public ResponseEntity<?> getDayBookEntries(
            @RequestParam String schoolId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            log.info("Fetching other fee day book entries for school: {}", schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            List<DayBookMFC> dayBookEntries = miscellaneousFeeCollectionService.getDayBookEntries(schoolId, startDate, endDate);
            return ResponseEntity.ok(dayBookEntries);
        } catch (Exception e) {
            log.error("Error fetching other fee day book entries: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch day book entries: " + e.getMessage()));
        }
    }

    @GetMapping("/total-paid/{admissionNumber}")
    public ResponseEntity<?> getTotalPaidAmount(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            log.info("Fetching total other fee paid amount for admission number: {}, school: {}", admissionNumber, schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            Double totalPaid = miscellaneousFeeCollectionService.getTotalPaidAmount(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(Map.of("totalPaid", totalPaid));
        } catch (Exception e) {
            log.error("Error fetching total other fee paid amount: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch total paid amount: " + e.getMessage()));
        }
    }

    @GetMapping("/payment-history-detailed/{admissionNumber}")
    public ResponseEntity<?> getPaymentHistoryDetailed(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId) {
        try {
            log.info("Fetching detailed other fee payment history for admission number: {}, school: {}", admissionNumber, schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            List<Map<String, Object>> paymentHistory = miscellaneousFeeCollectionService.getPaymentHistoryDetailed(schoolId, admissionNumber);

            if (paymentHistory.isEmpty()) {
                log.info("No other fee payment history found for admission number: {}", admissionNumber);
                return ResponseEntity.ok(List.of());
            }

            log.info("Successfully retrieved {} detailed other fee payment history records for admission number: {}",
                    paymentHistory.size(), admissionNumber);
            return ResponseEntity.ok(paymentHistory);
        } catch (Exception e) {
            log.error("Error fetching detailed other fee payment history for admission number {}: {}", admissionNumber, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch payment history: " + e.getMessage()));
        }
    }

    @GetMapping("/fee-heads")
    public ResponseEntity<?> getFeeHeads(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            log.info("Fetching other fee heads for school: {}, academic year: {}", schoolId, academicYear);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            List<Map<String, Object>> feeHeads = miscellaneousFeeCollectionService.getFeeHeads(schoolId, academicYear);
            return ResponseEntity.ok(feeHeads);
        } catch (Exception e) {
            log.error("Error fetching fee heads: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch fee heads: " + e.getMessage()));
        }
    }

    // NEW ENDPOINT: Get individual fees for a student
    @GetMapping("/individual-fees/{admissionNumber}")
    public ResponseEntity<?> getIndividualFees(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            log.info("Fetching individual fees for admission number: {}, school: {}, academic year: {}",
                    admissionNumber, schoolId, academicYear);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }
            if (academicYear == null || academicYear.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Academic year is required"));
            }
            if (admissionNumber == null || admissionNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Admission number is required"));
            }

            List<Map<String, Object>> individualFees = miscellaneousFeeCollectionService.getIndividualFees(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(individualFees);
        } catch (Exception e) {
            log.error("Error fetching individual fees for admission number {}: {}", admissionNumber, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch individual fees: " + e.getMessage()));
        }
    }
}