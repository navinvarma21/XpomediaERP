package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.ReceiptHeadDTO;
import com.backend.school_erp.entity.Administration.ReceiptHead;
import com.backend.school_erp.service.Administration.ReceiptHeadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administration/receiptsetup")
@Slf4j
public class ReceiptHeadController {

    @Autowired
    private ReceiptHeadService receiptHeadService;

    @GetMapping("/heads")
    public ResponseEntity<List<ReceiptHead>> getReceiptHeads(
            @RequestHeader("X-School-Id") String schoolId,
            @RequestHeader("X-Academic-Year") String academicYear) {
        try {
            log.info("📋 Fetching receipt heads for school: {}, academic year: {}", schoolId, academicYear);
            List<ReceiptHead> receiptHeads = receiptHeadService.getReceiptHeads(schoolId, academicYear);
            return ResponseEntity.ok(receiptHeads);
        } catch (Exception e) {
            log.error("❌ Error fetching receipt heads: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/heads")
    public ResponseEntity<?> addReceiptHead(
            @RequestHeader("X-School-Id") String schoolId,
            @RequestHeader("X-Academic-Year") String academicYear,
            @RequestBody ReceiptHeadDTO receiptHeadDTO) {
        try {
            log.info("➕ Adding receipt head: {} for school: {}, academic year: {}",
                    receiptHeadDTO.getHeadName(), schoolId, academicYear);

            // Set academic year from header to DTO
            receiptHeadDTO.setAcademicYear(academicYear);

            ReceiptHead newReceiptHead = receiptHeadService.addReceiptHead(schoolId, receiptHeadDTO);
            return ResponseEntity.ok(newReceiptHead);
        } catch (RuntimeException e) {
            log.error("❌ Error adding receipt head: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Unexpected error adding receipt head: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to add receipt head");
        }
    }

    @PutMapping("/heads/{id}")
    public ResponseEntity<?> updateReceiptHead(
            @RequestHeader("X-School-Id") String schoolId,
            @RequestHeader("X-Academic-Year") String academicYear,
            @PathVariable Long id,
            @RequestBody ReceiptHeadDTO receiptHeadDTO) {
        try {
            log.info("✏️ Updating receipt head ID: {} for school: {}, academic year: {}",
                    id, schoolId, academicYear);

            // Set academic year from header to DTO
            receiptHeadDTO.setAcademicYear(academicYear);

            ReceiptHead updatedReceiptHead = receiptHeadService.updateReceiptHead(schoolId, id, receiptHeadDTO);
            return ResponseEntity.ok(updatedReceiptHead);
        } catch (RuntimeException e) {
            log.error("❌ Error updating receipt head: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Unexpected error updating receipt head: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to update receipt head");
        }
    }

    @DeleteMapping("/heads/{id}")
    public ResponseEntity<?> deleteReceiptHead(
            @RequestHeader("X-School-Id") String schoolId,
            @RequestHeader("X-Academic-Year") String academicYear,
            @PathVariable Long id) {
        try {
            log.info("🗑️ Deleting receipt head ID: {} for school: {}, academic year: {}",
                    id, schoolId, academicYear);

            receiptHeadService.deleteReceiptHead(schoolId, id, academicYear);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("❌ Error deleting receipt head: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Unexpected error deleting receipt head: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to delete receipt head");
        }
    }
}