package com.backend.school_erp.controller.Collection;

import com.backend.school_erp.service.Collection.TutionReportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/transaction/tutionreport")
@Slf4j
public class TutionReportController {

    @Autowired
    private TutionReportService tutionReportService;

    @GetMapping("/day-collection")
    public ResponseEntity<?> getDayCollectionReport(
            @RequestParam String date,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {

        try {
            log.info("📋 Received day collection report request - Date: {}, School: {}, Academic Year: {}",
                    date, schoolId, academicYear);

            // Validate inputs
            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "status", "error",
                                "message", "School ID is required",
                                "code", "VALIDATION_ERROR"
                        )
                );
            }

            if (academicYear == null || academicYear.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "status", "error",
                                "message", "Academic Year is required",
                                "code", "VALIDATION_ERROR"
                        )
                );
            }

            // Validate date format (YYYY-MM-DD)
            if (!date.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "status", "error",
                                "message", "Invalid date format. Use YYYY-MM-DD",
                                "code", "DATE_FORMAT_ERROR"
                        )
                );
            }

            Map<String, Object> report = tutionReportService.getDayCollectionReport(date, schoolId, academicYear);

            // Add metadata
            report.put("status", "success");
            report.put("message", "Day collection report generated successfully");
            report.put("service", "Tuition Report Service");
            report.put("timestamp", java.time.LocalDateTime.now().toString());

            return ResponseEntity.ok(report);

        } catch (Exception e) {
            log.error("❌ Error in day collection report: {}", e.getMessage(), e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to generate day collection report");
            errorResponse.put("error", e.getMessage());
            errorResponse.put("code", "INTERNAL_ERROR");
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());

            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/periodical-collection")
    public ResponseEntity<?> getPeriodicalCollectionReport(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {

        try {
            log.info("📋 Received periodical collection report request - Start: {}, End: {}, School: {}, Academic Year: {}",
                    startDate, endDate, schoolId, academicYear);

            // Validate inputs
            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "status", "error",
                                "message", "School ID is required",
                                "code", "VALIDATION_ERROR"
                        )
                );
            }

            if (academicYear == null || academicYear.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "status", "error",
                                "message", "Academic Year is required",
                                "code", "VALIDATION_ERROR"
                        )
                );
            }

            // Validate date formats
            if (!startDate.matches("\\d{4}-\\d{2}-\\d{2}") || !endDate.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "status", "error",
                                "message", "Invalid date format. Use YYYY-MM-DD",
                                "code", "DATE_FORMAT_ERROR"
                        )
                );
            }

            // Validate date range
            if (startDate.compareTo(endDate) > 0) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "status", "error",
                                "message", "Start date cannot be after end date",
                                "code", "DATE_RANGE_ERROR"
                        )
                );
            }

            Map<String, Object> report = tutionReportService.getPeriodicalCollectionReport(
                    startDate, endDate, schoolId, academicYear);

            // Add metadata
            report.put("status", "success");
            report.put("message", "Periodical collection report generated successfully");
            report.put("service", "Tuition Report Service");
            report.put("timestamp", java.time.LocalDateTime.now().toString());

            return ResponseEntity.ok(report);

        } catch (Exception e) {
            log.error("❌ Error in periodical collection report: {}", e.getMessage(), e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to generate periodical collection report");
            errorResponse.put("error", e.getMessage());
            errorResponse.put("code", "INTERNAL_ERROR");
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());

            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/collection-summary")
    public ResponseEntity<?> getCollectionSummary(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(defaultValue = "30") String period) {

        try {
            log.info("📊 Received collection summary request - School: {}, Academic Year: {}, Period: {} days",
                    schoolId, academicYear, period);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "status", "error",
                                "message", "School ID is required",
                                "code", "VALIDATION_ERROR"
                        )
                );
            }

            Map<String, Object> summary = tutionReportService.getCollectionSummary(schoolId, academicYear, period);

            // Add metadata
            summary.put("status", "success");
            summary.put("message", "Collection summary generated successfully");
            summary.put("service", "Tuition Report Service");
            summary.put("timestamp", java.time.LocalDateTime.now().toString());

            return ResponseEntity.ok(summary);

        } catch (Exception e) {
            log.error("❌ Error in collection summary: {}", e.getMessage(), e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to generate collection summary");
            errorResponse.put("error", e.getMessage());
            errorResponse.put("code", "INTERNAL_ERROR");
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());

            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/collection-statistics")
    public ResponseEntity<?> getCollectionStatistics(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {

        try {
            log.info("📈 Received collection statistics request - School: {}, Academic Year: {}",
                    schoolId, academicYear);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "status", "error",
                                "message", "School ID is required",
                                "code", "VALIDATION_ERROR"
                        )
                );
            }

            Map<String, Object> statistics = tutionReportService.getCollectionStatistics(schoolId, academicYear);

            // Add metadata
            statistics.put("status", "success");
            statistics.put("message", "Collection statistics generated successfully");
            statistics.put("service", "Tuition Report Service");
            statistics.put("timestamp", java.time.LocalDateTime.now().toString());

            return ResponseEntity.ok(statistics);

        } catch (Exception e) {
            log.error("❌ Error in collection statistics: {}", e.getMessage(), e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to generate collection statistics");
            errorResponse.put("error", e.getMessage());
            errorResponse.put("code", "INTERNAL_ERROR");
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());

            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/monthly-collection")
    public ResponseEntity<?> getMonthlyCollectionReport(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String month,
            @RequestParam String year) {

        try {
            log.info("📅 Received monthly collection report request - School: {}, Academic Year: {}, Month: {}, Year: {}",
                    schoolId, academicYear, month, year);

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "status", "error",
                                "message", "School ID is required",
                                "code", "VALIDATION_ERROR"
                        )
                );
            }

            if (academicYear == null || academicYear.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "status", "error",
                                "message", "Academic Year is required",
                                "code", "VALIDATION_ERROR"
                        )
                );
            }

            // Validate month and year
            try {
                int monthNum = Integer.parseInt(month);
                int yearNum = Integer.parseInt(year);

                if (monthNum < 1 || monthNum > 12) {
                    throw new NumberFormatException("Month must be between 1 and 12");
                }
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "status", "error",
                                "message", "Invalid month or year format",
                                "code", "DATE_FORMAT_ERROR"
                        )
                );
            }

            Map<String, Object> report = tutionReportService.getMonthlyCollectionReport(
                    schoolId, month, year, academicYear);

            // Add metadata
            report.put("status", "success");
            report.put("message", "Monthly collection report generated successfully");
            report.put("service", "Tuition Report Service");
            report.put("timestamp", java.time.LocalDateTime.now().toString());

            return ResponseEntity.ok(report);

        } catch (Exception e) {
            log.error("❌ Error in monthly collection report: {}", e.getMessage(), e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to generate monthly collection report");
            errorResponse.put("error", e.getMessage());
            errorResponse.put("code", "INTERNAL_ERROR");
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());

            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Tuition Report Service");
        response.put("version", "2.0.0");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        response.put("database", "Connected to Daily Fee Collection System");
        response.put("endpoints", Map.of(
                "day-collection", "/api/transaction/tutionreport/day-collection",
                "periodical-collection", "/api/transaction/tutionreport/periodical-collection",
                "collection-summary", "/api/transaction/tutionreport/collection-summary",
                "collection-statistics", "/api/transaction/tutionreport/collection-statistics",
                "monthly-collection", "/api/transaction/tutionreport/monthly-collection"
        ));

        return ResponseEntity.ok(response);
    }
}