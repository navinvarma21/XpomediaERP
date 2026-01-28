package com.backend.school_erp.controller.Collection;

import com.backend.school_erp.DTO.Collection.MOCollectionReportResponse;
import com.backend.school_erp.DTO.Collection.MODayCollectionRequest;
import com.backend.school_erp.DTO.Collection.MOPeriodicalCollectionRequest;
import com.backend.school_erp.service.Collection.CollectionReportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/transaction/otherreport")
@Slf4j
public class OtherFeeReportController {

    @Autowired
    private CollectionReportService collectionReportService;

    @PostMapping("/day-collection")
    public ResponseEntity<?> getDayCollectionReport(@RequestBody MODayCollectionRequest request) {
        try {
            log.info("Received day collection report request - School: {}, Academic Year: {}, Date: {} to {}",
                    request.getSchoolId(), request.getAcademicYear(),
                    request.getStartDate(), request.getEndDate());

            if (request.getSchoolId() == null || request.getSchoolId().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("success", false, "message", "School ID is required")
                );
            }

            if (request.getAcademicYear() == null || request.getAcademicYear().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("success", false, "message", "Academic Year is required")
                );
            }

            if (request.getStartDate() == null || request.getEndDate() == null) {
                return ResponseEntity.badRequest().body(
                        Map.of("success", false, "message", "Start date and end date are required")
                );
            }

            MOCollectionReportResponse response = collectionReportService.getDayCollectionReport(request);

            if (response.isSuccess()) {
                // Add school info to response
                Map<String, String> schoolInfo = collectionReportService.getSchoolInfo(request.getSchoolId());
                response.getSummary().put("schoolInfo", schoolInfo);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error in day collection report: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "message", "Failed to generate day collection report: " + e.getMessage())
            );
        }
    }

    @PostMapping("/periodical-collection")
    public ResponseEntity<?> getPeriodicalCollectionReport(@RequestBody MOPeriodicalCollectionRequest request) {
        try {
            log.info("Received periodical collection report request - School: {}, Academic Year: {}, Period: {} to {}",
                    request.getSchoolId(), request.getAcademicYear(),
                    request.getStartDate(), request.getEndDate());

            if (request.getSchoolId() == null || request.getSchoolId().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("success", false, "message", "School ID is required")
                );
            }

            if (request.getAcademicYear() == null || request.getAcademicYear().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("success", false, "message", "Academic Year is required")
                );
            }

            if (request.getStartDate() == null || request.getEndDate() == null) {
                return ResponseEntity.badRequest().body(
                        Map.of("success", false, "message", "Start date and end date are required")
                );
            }

            // Validate date range
            if (request.getStartDate().isAfter(request.getEndDate())) {
                return ResponseEntity.badRequest().body(
                        Map.of("success", false, "message", "Start date cannot be after end date")
                );
            }

            MOCollectionReportResponse response = collectionReportService.getPeriodicalCollectionReport(request);

            if (response.isSuccess()) {
                // Add school info to response
                Map<String, String> schoolInfo = collectionReportService.getSchoolInfo(request.getSchoolId());
                response.getSummary().put("schoolInfo", schoolInfo);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error in periodical collection report: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "message", "Failed to generate periodical collection report: " + e.getMessage())
            );
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Collection Report Service");
        response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return ResponseEntity.ok(response);
    }
}