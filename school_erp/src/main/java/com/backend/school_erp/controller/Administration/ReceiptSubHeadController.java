package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.ReceiptSubHeadDTO;
import com.backend.school_erp.entity.Administration.ReceiptSubHead;
import com.backend.school_erp.service.Administration.ReceiptSubHeadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administration/receiptsetup")
@Slf4j
public class ReceiptSubHeadController {

    @Autowired
    private ReceiptSubHeadService receiptSubHeadService;

    @GetMapping("/subheads")
    public ResponseEntity<List<ReceiptSubHead>> getReceiptSubHeads(
            @RequestHeader("X-School-Id") String schoolId,
            @RequestHeader("X-Academic-Year") String academicYear) {
        try {
            log.info("📋 Fetching receipt sub heads for school: {}, academic year: {}", schoolId, academicYear);
            List<ReceiptSubHead> receiptSubHeads = receiptSubHeadService.getReceiptSubHeads(schoolId, academicYear);
            return ResponseEntity.ok(receiptSubHeads);
        } catch (Exception e) {
            log.error("❌ Error fetching receipt sub heads: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/subheads")
    public ResponseEntity<?> addReceiptSubHead(
            @RequestHeader("X-School-Id") String schoolId,
            @RequestHeader("X-Academic-Year") String academicYear,
            @RequestBody ReceiptSubHeadDTO receiptSubHeadDTO) {
        try {
            log.info("➕ Adding receipt sub head: {} for main head: {}, school: {}, academic year: {}",
                    receiptSubHeadDTO.getSubHeadName(), receiptSubHeadDTO.getMainHeadName(), schoolId, academicYear);

            // Set academic year from header to DTO
            receiptSubHeadDTO.setAcademicYear(academicYear);

            ReceiptSubHead newReceiptSubHead = receiptSubHeadService.addReceiptSubHead(schoolId, receiptSubHeadDTO);
            return ResponseEntity.ok(newReceiptSubHead);
        } catch (RuntimeException e) {
            log.error("❌ Error adding receipt sub head: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Unexpected error adding receipt sub head: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to add receipt sub head");
        }
    }

    @PutMapping("/subheads/{id}")
    public ResponseEntity<?> updateReceiptSubHead(
            @RequestHeader("X-School-Id") String schoolId,
            @RequestHeader("X-Academic-Year") String academicYear,
            @PathVariable Long id,
            @RequestBody ReceiptSubHeadDTO receiptSubHeadDTO) {
        try {
            log.info("✏️ Updating receipt sub head ID: {} for school: {}, academic year: {}",
                    id, schoolId, academicYear);

            // Set academic year from header to DTO
            receiptSubHeadDTO.setAcademicYear(academicYear);

            ReceiptSubHead updatedReceiptSubHead = receiptSubHeadService.updateReceiptSubHead(schoolId, id, receiptSubHeadDTO);
            return ResponseEntity.ok(updatedReceiptSubHead);
        } catch (RuntimeException e) {
            log.error("❌ Error updating receipt sub head: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Unexpected error updating receipt sub head: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to update receipt sub head");
        }
    }

    @DeleteMapping("/subheads/{id}")
    public ResponseEntity<?> deleteReceiptSubHead(
            @RequestHeader("X-School-Id") String schoolId,
            @RequestHeader("X-Academic-Year") String academicYear,
            @PathVariable Long id) {
        try {
            log.info("🗑️ Deleting receipt sub head ID: {} for school: {}, academic year: {}",
                    id, schoolId, academicYear);

            receiptSubHeadService.deleteReceiptSubHead(schoolId, id, academicYear);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("❌ Error deleting receipt sub head: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Unexpected error deleting receipt sub head: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to delete receipt sub head");
        }
    }
}