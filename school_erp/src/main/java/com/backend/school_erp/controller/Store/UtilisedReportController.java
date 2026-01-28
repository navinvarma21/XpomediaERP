package com.backend.school_erp.controller.Store;

import com.backend.school_erp.service.Store.UtilisedReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/store/utilised-report")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowedHeaders = "*", allowCredentials = "true")
public class UtilisedReportController {

    private final UtilisedReportService service;

    // Endpoint to populate the Dropdowns
    @GetMapping("/customers")
    public ResponseEntity<List<Map<String, Object>>> getCustomers(@RequestParam String schoolId) {
        return ResponseEntity.ok(service.getCustomersFromSales(schoolId));
    }

    // Endpoint to get the Report Data
    @GetMapping("/generate")
    public ResponseEntity<List<Map<String, Object>>> generateReport(
            @RequestParam String schoolId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String customerCode) {

        return ResponseEntity.ok(service.generateReport(schoolId, startDate, endDate, customerCode));
    }
}