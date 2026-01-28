package com.backend.school_erp.controller.Store;

import com.backend.school_erp.service.Store.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/store/ledger")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowedHeaders = "*", allowCredentials = "true")
public class LedgerController {

    private final LedgerService service;

    @GetMapping("/suppliers")
    public ResponseEntity<List<Map<String, Object>>> getSuppliers(@RequestParam String schoolId) {
        return ResponseEntity.ok(service.getSuppliers(schoolId));
    }

    @GetMapping("/generate")
    public ResponseEntity<List<Map<String, Object>>> generateReport(
            @RequestParam String schoolId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String supplierCode) {

        return ResponseEntity.ok(service.generateLedger(schoolId, startDate, endDate, supplierCode));
    }
}