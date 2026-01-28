package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.PaymentSubHeadDTO;
import com.backend.school_erp.entity.Administration.PaymentSubHead;
import com.backend.school_erp.service.Administration.PaymentSubHeadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administration/paymentsubhead")
@RequiredArgsConstructor
@Slf4j
public class PaymentSubHeadController {

    private final PaymentSubHeadService paymentSubHeadService;

    @GetMapping
    public ResponseEntity<List<PaymentSubHead>> getPaymentSubHeads(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            log.info("📥 Getting payment sub heads for school: {}, academic year: {}", schoolId, academicYear);
            List<PaymentSubHead> paymentSubHeads = paymentSubHeadService.getPaymentSubHeads(schoolId, academicYear);
            return ResponseEntity.ok(paymentSubHeads);
        } catch (Exception e) {
            log.error("❌ Error getting payment sub heads: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> addPaymentSubHead(
            @RequestParam String schoolId,
            @RequestBody PaymentSubHeadDTO dto) {
        try {
            log.info("➕ Adding payment sub head: {} under main head: {} for school: {}, academic year: {}",
                    dto.getPaymentSubHead(), dto.getPaymentMainHead(), schoolId, dto.getAcademicYear());
            PaymentSubHead paymentSubHead = paymentSubHeadService.addPaymentSubHead(schoolId, dto);
            return ResponseEntity.ok(paymentSubHead);
        } catch (RuntimeException e) {
            log.error("❌ Error adding payment sub head: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Error adding payment sub head: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to add payment sub head");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePaymentSubHead(
            @PathVariable Long id,
            @RequestParam String schoolId,
            @RequestBody PaymentSubHeadDTO dto) {
        try {
            log.info("✏️ Updating payment sub head ID: {} for school: {}", id, schoolId);
            PaymentSubHead paymentSubHead = paymentSubHeadService.updatePaymentSubHead(schoolId, id, dto);
            return ResponseEntity.ok(paymentSubHead);
        } catch (RuntimeException e) {
            log.error("❌ Error updating payment sub head: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Error updating payment sub head: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to update payment sub head");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePaymentSubHead(
            @PathVariable Long id,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            log.info("🗑️ Deleting payment sub head ID: {} for school: {}", id, schoolId);
            paymentSubHeadService.deletePaymentSubHead(schoolId, id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("❌ Error deleting payment sub head: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Error deleting payment sub head: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to delete payment sub head");
        }
    }
}