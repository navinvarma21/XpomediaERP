package com.backend.school_erp.controller.Transport;

import com.backend.school_erp.service.Transport.BusBillCollectionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/transport/buscollection")
@Slf4j
public class BusBillCollectionController {

    @Autowired
    private BusBillCollectionService busBillCollectionService;

    @GetMapping("/day-collection")
    public ResponseEntity<?> getDayCollectionReport(
            @RequestParam String date,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {

        try {
            log.info("Received bus day collection report request - Date: {}, School: {}, Academic Year: {}",
                    date, schoolId, academicYear);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "School ID is required")
                );
            }

            if (academicYear == null || academicYear.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Academic Year is required")
                );
            }

            Map<String, Object> report = busBillCollectionService.getDayCollectionReport(date, schoolId, academicYear);
            return ResponseEntity.ok(report);

        } catch (Exception e) {
            log.error("Error in bus day collection report: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Failed to generate bus day collection report: " + e.getMessage())
            );
        }
    }

    @GetMapping("/periodical-collection")
    public ResponseEntity<?> getPeriodicalCollectionReport(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {

        try {
            log.info("Received bus periodical collection report request - Start: {}, End: {}, School: {}, Academic Year: {}",
                    startDate, endDate, schoolId, academicYear);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "School ID is required")
                );
            }

            if (academicYear == null || academicYear.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Academic Year is required")
                );
            }

            if (startDate.compareTo(endDate) > 0) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Start date cannot be after end date")
                );
            }

            Map<String, Object> report = busBillCollectionService.getPeriodicalCollectionReport(
                    startDate, endDate, schoolId, academicYear);

            return ResponseEntity.ok(report);

        } catch (Exception e) {
            log.error("Error in bus periodical collection report: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Failed to generate bus periodical collection report: " + e.getMessage())
            );
        }
    }

    @GetMapping("/collection-summary")
    public ResponseEntity<?> getCollectionSummary(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {

        try {
            log.info("Received bus collection summary request - School: {}, Academic Year: {}",
                    schoolId, academicYear);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "School ID is required")
                );
            }

            Map<String, Object> summary = busBillCollectionService.getCollectionSummary(schoolId, academicYear);
            return ResponseEntity.ok(summary);

        } catch (Exception e) {
            log.error("Error in bus collection summary: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Failed to generate bus collection summary: " + e.getMessage())
            );
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Bus Bill Collection Report Service");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
}