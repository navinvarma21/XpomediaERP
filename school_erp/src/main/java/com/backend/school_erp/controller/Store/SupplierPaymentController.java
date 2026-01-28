package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.SupplierPaymentDTO;
import com.backend.school_erp.service.Store.SupplierPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/store/supplier-payment")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowedHeaders = "*", allowCredentials = "true")
public class SupplierPaymentController {

    private final SupplierPaymentService service;

    @GetMapping("/next-entry")
    public ResponseEntity<Map<String, String>> getNextEntry(@RequestParam String schoolId) {
        return ResponseEntity.ok(Map.of("entryNo", service.generateEntryNo(schoolId)));
    }

    @GetMapping("/pending-suppliers")
    public ResponseEntity<List<Map<String, Object>>> getSuppliers(@RequestParam String schoolId) {
        return ResponseEntity.ok(service.getPendingSuppliers(schoolId));
    }

    @GetMapping("/pending-invoices")
    public ResponseEntity<List<Map<String, Object>>> getInvoices(
            @RequestParam String schoolId,
            @RequestParam String supplierCode) {
        return ResponseEntity.ok(service.getPendingInvoices(schoolId, supplierCode));
    }

    @PostMapping("/save")
    public ResponseEntity<?> savePayment(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody SupplierPaymentDTO dto) {
        try {
            String entryNo = service.savePayment(schoolId, year, dto);
            return ResponseEntity.ok(Map.of("status", "success", "entryNo", entryNo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}