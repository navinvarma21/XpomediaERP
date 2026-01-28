package com.backend.school_erp.controller.Store;

import com.backend.school_erp.service.Store.BookDistributeReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/store/distribute-report")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowedHeaders = "*", allowCredentials = "true")
public class BookDistributeReportController {

    private final BookDistributeReportService service;

    @GetMapping("/generate")
    public ResponseEntity<List<Map<String, Object>>> generateReport(
            @RequestParam String schoolId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "false") boolean isOverall) {

        // Handle null dates if isOverall is true
        if (startDate == null) startDate = LocalDate.now();
        if (endDate == null) endDate = LocalDate.now();

        return ResponseEntity.ok(service.generateReport(schoolId, startDate, endDate, isOverall));
    }
}