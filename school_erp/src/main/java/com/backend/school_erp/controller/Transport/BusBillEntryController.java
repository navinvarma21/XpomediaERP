package com.backend.school_erp.controller.Transport;

import com.backend.school_erp.DTO.Transport.BusBillEntryDTO;
import com.backend.school_erp.entity.Transport.BusBillEntry;
import com.backend.school_erp.service.Transport.BusBillEntryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transport/busbillentry")
@Slf4j
public class BusBillEntryController {

    @Autowired
    private BusBillEntryService busBillEntryService;

    @PostMapping("/process-bus-payment")
    public ResponseEntity<?> processBusPayment(
            @RequestBody BusBillEntryDTO busBillEntryDTO,
            @RequestParam String schoolId) {
        try {
            log.info("Processing bus payment for bus bill number: {}, school: {}", busBillEntryDTO.getBusBillNumber(), schoolId);
            log.info("Bus fee payments count: {}", busBillEntryDTO.getBusFeePayments() != null ? busBillEntryDTO.getBusFeePayments().size() : 0);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            // Validate required fields
            if (busBillEntryDTO.getBusBillNumber() == null || busBillEntryDTO.getBusBillNumber().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Bus bill number is required"));
            }
            if (busBillEntryDTO.getAdmissionNumber() == null || busBillEntryDTO.getAdmissionNumber().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Admission number is required"));
            }
            if (busBillEntryDTO.getBusFeePayments() == null || busBillEntryDTO.getBusFeePayments().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Bus fee payment is required"));
            }

            BusBillEntry result = busBillEntryService.processBusPayment(schoolId, busBillEntryDTO);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error processing bus payment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to process bus payment: " + e.getMessage()));
        }
    }

    @GetMapping("/bus-payment-history/{admissionNumber}")
    public ResponseEntity<?> getBusPaymentHistory(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId) {
        try {
            log.info("Fetching bus payment history for admission number: {}, school: {}", admissionNumber, schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }
            if (admissionNumber == null || admissionNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Admission number is required"));
            }

            List<Map<String, Object>> paymentHistory = busBillEntryService.getBusPaymentHistory(schoolId, admissionNumber);

            if (paymentHistory.isEmpty()) {
                log.info("No bus payment history found for admission number: {}", admissionNumber);
                return ResponseEntity.ok(List.of());
            }

            log.info("Successfully retrieved {} bus payment history records for admission number: {}",
                    paymentHistory.size(), admissionNumber);
            return ResponseEntity.ok(paymentHistory);
        } catch (Exception e) {
            log.error("Error fetching bus payment history for admission number {}: {}", admissionNumber, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch bus payment history: " + e.getMessage()));
        }
    }

    @GetMapping("/last-bus-bill-number")
    public ResponseEntity<?> getLastBusBillNumber(@RequestParam String schoolId) {
        try {
            log.info("Fetching last bus bill number for school: {}", schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            Map<String, String> result = busBillEntryService.getLastBusBillNumber(schoolId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching last bus bill number: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch last bus bill number: " + e.getMessage()));
        }
    }

    @GetMapping("/school")
    public ResponseEntity<?> getBusBillEntriesBySchool(
            @RequestParam String schoolId,
            @RequestParam(required = false) String academicYear) {
        try {
            log.info("Fetching bus bill entries for school: {}", schoolId);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            List<BusBillEntry> busBillEntries = busBillEntryService.getBusBillEntriesBySchool(schoolId, academicYear);
            return ResponseEntity.ok(busBillEntries);
        } catch (Exception e) {
            log.error("Error fetching bus bill entries: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch bus bill entries: " + e.getMessage()));
        }
    }

    @GetMapping("/admission/{admissionNumber}")
    public ResponseEntity<?> getBusBillEntriesByAdmissionNumber(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId,
            @RequestParam(required = false) String academicYear) {
        try {
            log.info("Fetching bus bill entries for admission number: {}", admissionNumber);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            List<BusBillEntry> busBillEntries = busBillEntryService.getBusBillEntriesByAdmissionNumber(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(busBillEntries);
        } catch (Exception e) {
            log.error("Error fetching bus bill entries: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch bus bill entries: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBusBillEntryById(
            @PathVariable Long id,
            @RequestParam String schoolId) {
        try {
            log.info("Fetching bus bill entry by ID: {}", id);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            return busBillEntryService.getBusBillEntryById(schoolId, id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching bus bill entry: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch bus bill entry: " + e.getMessage()));
        }
    }

    @GetMapping("/bus-bill/{busBillNumber}")
    public ResponseEntity<?> getBusBillEntryByBusBillNumber(
            @PathVariable String busBillNumber,
            @RequestParam String schoolId) {
        try {
            log.info("Fetching bus bill entry by bus bill number: {}", busBillNumber);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            return busBillEntryService.getBusBillEntryByBusBillNumber(schoolId, busBillNumber)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching bus bill entry: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch bus bill entry: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBusBillEntry(
            @PathVariable Long id,
            @RequestParam String schoolId) {
        try {
            log.info("Deleting bus bill entry with ID: {}", id);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "School ID is required"));
            }

            boolean deleted = busBillEntryService.deleteBusBillEntry(schoolId, id);
            if (deleted) {
                return ResponseEntity.ok().body(Map.of("message", "Bus bill entry deleted successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting bus bill entry: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to delete bus bill entry: " + e.getMessage()));
        }
    }
}