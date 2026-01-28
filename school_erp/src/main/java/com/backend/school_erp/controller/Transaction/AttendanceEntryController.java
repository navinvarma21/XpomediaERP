package com.backend.school_erp.controller.Transaction;

import com.backend.school_erp.DTO.Transaction.*;
import com.backend.school_erp.service.Transaction.AttendanceEntryService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transaction/attendanceentry")
@Slf4j
public class AttendanceEntryController {

    private final AttendanceEntryService attendanceEntryService;

    public AttendanceEntryController(AttendanceEntryService attendanceEntryService) {
        this.attendanceEntryService = attendanceEntryService;
    }

    @PostMapping("/save")
    public ResponseEntity<AttendanceBulkResponseDTO> saveAttendance(
            @Valid @RequestBody AttendanceEntryRequestDTO request) {
        try {
            log.info("📥 Saving attendance for school: {}, class: {}-{}, date: {}, records: {}",
                    request.getSchoolId(), request.getStandard(),
                    request.getSection(), request.getAttendanceDate(),
                    request.getAttendanceRecords().size());

            AttendanceBulkResponseDTO response = attendanceEntryService.saveAttendance(request);

            if (response.isSuccess()) {
                log.info("✅ Attendance saved successfully: {} records", response.getRecordsProcessed());
            } else {
                log.warn("⚠️ Partial attendance save: {}", response.getMessage());
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error saving attendance: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(
                    AttendanceBulkResponseDTO.builder()
                            .success(false)
                            .message("Failed to save attendance: " + e.getMessage())
                            .recordsProcessed(0)
                            .recordsSaved(0)
                            .recordsUpdated(0)
                            .timestamp(java.time.LocalDateTime.now())
                            .build()
            );
        }
    }

    @GetMapping("/check")
    public ResponseEntity<AttendanceCheckResponseDTO> checkExistingAttendance(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam Long studentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        try {
            AttendanceCheckResponseDTO response =
                    attendanceEntryService.checkExistingAttendance(schoolId, academicYear, studentId, date);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error checking attendance: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    AttendanceCheckResponseDTO.builder()
                            .exists(false)
                            .attendanceStatus(null)
                            .build()
            );
        }
    }

    // --- UPDATED VIEW ENDPOINT (PERIODICAL & ADMISSION NO) ---
    @GetMapping("/view")
    public ResponseEntity<List<AttendanceEntryResponseDTO>> getAttendanceByCriteria(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(required = false, defaultValue = "All") String standard,
            @RequestParam(required = false, defaultValue = "All") String section,
            @RequestParam(required = false) String admissionNumber,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) { // Kept for backward compat if needed, but logic uses from/to

        try {
            // Handle Date Logic: If fromDate/toDate missing, use 'date' or current date
            LocalDate start = fromDate != null ? fromDate : (date != null ? date : LocalDate.now());
            LocalDate end = toDate != null ? toDate : (date != null ? date : LocalDate.now());

            List<AttendanceEntryResponseDTO> attendance =
                    attendanceEntryService.getAttendanceByCriteria(schoolId, academicYear, standard, section, admissionNumber, start, end);

            return ResponseEntity.ok(attendance);

        } catch (Exception e) {
            log.error("❌ Error fetching attendance: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getAttendanceStatistics(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String standard,
            @RequestParam String section,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        try {
            Map<String, Object> statistics =
                    attendanceEntryService.getAttendanceStatistics(schoolId, academicYear, standard, section, date);

            return ResponseEntity.ok(statistics);

        } catch (Exception e) {
            log.error("❌ Error fetching attendance statistics: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // --- Single Student Profile for TC/Certificate ---
    @GetMapping("/student-profile")
    public ResponseEntity<Map<String, Object>> getStudentProfile(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam Long studentId) {
        try {
            Map<String, Object> profile = attendanceEntryService.getStudentAttendanceProfile(schoolId, academicYear, studentId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("❌ Error fetching student profile: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Attendance Entry Service",
                "timestamp", LocalDate.now().toString()
        ));
    }
}