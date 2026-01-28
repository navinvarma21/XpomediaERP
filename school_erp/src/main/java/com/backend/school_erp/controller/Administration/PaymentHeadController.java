package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.PaymentHeadDTO;
import com.backend.school_erp.entity.Administration.PaymentHead;
import com.backend.school_erp.service.Administration.PaymentHeadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administration/paymenthead")
@RequiredArgsConstructor
@Slf4j
public class PaymentHeadController {

    private final PaymentHeadService paymentHeadService;

    @GetMapping
    public ResponseEntity<List<PaymentHead>> getPaymentHeads(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            log.info("📥 Getting payment heads for school: {}, academic year: {}", schoolId, academicYear);
            List<PaymentHead> paymentHeads = paymentHeadService.getPaymentHeads(schoolId, academicYear);
            return ResponseEntity.ok(paymentHeads);
        } catch (Exception e) {
            log.error("❌ Error getting payment heads: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> addPaymentHead(
            @RequestParam String schoolId,
            @RequestBody PaymentHeadDTO dto) {
        try {
            log.info("➕ Adding payment head: {} for school: {}, academic year: {}",
                    dto.getName(), schoolId, dto.getAcademicYear());
            PaymentHead paymentHead = paymentHeadService.addPaymentHead(schoolId, dto);
            return ResponseEntity.ok(paymentHead);
        } catch (RuntimeException e) {
            log.error("❌ Error adding payment head: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Error adding payment head: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to add payment head");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePaymentHead(
            @PathVariable Long id,
            @RequestParam String schoolId,
            @RequestBody PaymentHeadDTO dto) {
        try {
            log.info("✏️ Updating payment head ID: {} for school: {}", id, schoolId);
            PaymentHead paymentHead = paymentHeadService.updatePaymentHead(schoolId, id, dto);
            return ResponseEntity.ok(paymentHead);
        } catch (RuntimeException e) {
            log.error("❌ Error updating payment head: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Error updating payment head: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to update payment head");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePaymentHead(
            @PathVariable Long id,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            log.info("🗑️ Deleting payment head ID: {} for school: {}", id, schoolId);
            paymentHeadService.deletePaymentHead(schoolId, id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("❌ Error deleting payment head: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Error deleting payment head: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to delete payment head");
        }
    }
}