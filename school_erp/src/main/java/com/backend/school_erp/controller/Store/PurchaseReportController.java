package com.backend.school_erp.controller.Store;

import com.backend.school_erp.entity.Store.TabPurchase;
import com.backend.school_erp.service.Store.PurchaseReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/store/purchase-report")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowedHeaders = "*", allowCredentials = "true")
public class PurchaseReportController {

    private final PurchaseReportService service;

    @GetMapping("/suppliers")
    public ResponseEntity<List<Map<String, Object>>> getSuppliers(@RequestParam String schoolId) {
        return ResponseEntity.ok(service.getSuppliersFromTransactions(schoolId));
    }

    @GetMapping("/generate")
    public ResponseEntity<List<TabPurchase>> generateReport(
            @RequestParam String schoolId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String supplierCode) {

        return ResponseEntity.ok(service.generateReport(schoolId, startDate, endDate, supplierCode));
    }

    // NEW: Get all purchases for selected supplier (without date range)
    @GetMapping("/supplier/all")
    public ResponseEntity<List<TabPurchase>> getAllPurchasesForSupplier(
            @RequestParam String schoolId,
            @RequestParam(required = false) String supplierCode) {

        return ResponseEntity.ok(service.getAllPurchasesForSupplier(schoolId, supplierCode));
    }

    // NEW: Get all purchases (without any filters)
    @GetMapping("/all")
    public ResponseEntity<List<TabPurchase>> getAllPurchases(
            @RequestParam String schoolId) {

        return ResponseEntity.ok(service.getAllPurchases(schoolId));
    }
}