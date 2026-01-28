package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.StockReportDTO;
import com.backend.school_erp.service.Store.StockReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/store/report")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowedHeaders = "*", allowCredentials = "true")
public class StockReportController {

    private final StockReportService service;

    @GetMapping("/items")
    public ResponseEntity<List<String>> getItemNames(@RequestParam String schoolId) {
        return ResponseEntity.ok(service.getAllItemNames(schoolId));
    }

    @GetMapping("/generate")
    public ResponseEntity<List<StockReportDTO>> generateReport(
            @RequestParam String schoolId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String itemName) {

        return ResponseEntity.ok(service.generateStockReport(schoolId, startDate, endDate, itemName));
    }

    @GetMapping("/grouped")
    public ResponseEntity<Map<String, List<StockReportDTO>>> getGroupedReport(
            @RequestParam String schoolId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String itemName) {

        Map<String, List<StockReportDTO>> groupedReport = service.getGroupedStockReport(schoolId, startDate, endDate, itemName);
        return ResponseEntity.ok(groupedReport);
    }
}