package com.backend.school_erp.controller.AdmissionMaster;

import com.backend.school_erp.entity.AdmissionMaster.StudentRegisterReport;
import com.backend.school_erp.service.AdmissionMaster.StudentReportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admissionmaster/studentreport")
@Slf4j
public class StudentReportController {

    private final StudentReportService studentReportService;

    public StudentReportController(StudentReportService studentReportService) {
        this.studentReportService = studentReportService;
    }

    // Endpoint for Aadhaar EMIS report
    @GetMapping("/students")
    public ResponseEntity<?> getAllStudentsForAadhaarEmisReport(
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📥 Fetching all students for Aadhaar EMIS report - school: {}, academic year: {}", schoolId, academicYear);

            List<StudentRegisterReport> students = studentReportService.getAllStudentsForAadhaarEmisReport(schoolId, academicYear);

            log.info("✅ Successfully fetched {} students for Aadhaar EMIS report", students.size());
            return ResponseEntity.ok(students);

        } catch (Exception e) {
            log.error("❌ Error fetching students for Aadhaar EMIS report: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching students for Aadhaar EMIS report: " + e.getMessage()));
        }
    }

    // Main endpoint for student register data
    @GetMapping("/school/{schoolId}")
    public ResponseEntity<?> getAllStudentRegisterData(
            @PathVariable String schoolId,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📥 Fetching all student register data for school: {}, academic year: {}", schoolId, academicYear);

            List<StudentRegisterReport> students = studentReportService.getAllStudentRegisterData(schoolId, academicYear);

            log.info("✅ Successfully fetched {} students for register report", students.size());
            return ResponseEntity.ok(students);

        } catch (Exception e) {
            log.error("❌ Error fetching student register data: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching student register data: " + e.getMessage()));
        }
    }

    // Get students by standard
    @GetMapping("/school/{schoolId}/standard/{standard}")
    public ResponseEntity<?> getStudentRegisterDataByStandard(
            @PathVariable String schoolId,
            @PathVariable String standard,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📥 Fetching student register data for standard: {}, school: {}, academic year: {}",
                    standard, schoolId, academicYear);

            List<StudentRegisterReport> students = studentReportService
                    .getStudentRegisterDataByStandard(schoolId, academicYear, standard);

            log.info("✅ Successfully fetched {} students for standard {} in register report", students.size(), standard);
            return ResponseEntity.ok(students);

        } catch (Exception e) {
            log.error("❌ Error fetching student register data by standard: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching student register data by standard: " + e.getMessage()));
        }
    }

    // Search students
    @GetMapping("/school/{schoolId}/search")
    public ResponseEntity<?> searchStudentRegisterData(
            @PathVariable String schoolId,
            @RequestParam("academicYear") String academicYear,
            @RequestParam("term") String searchTerm) {

        try {
            log.info("🔍 Searching student register data for term: {}, school: {}, academic year: {}",
                    searchTerm, schoolId, academicYear);

            List<StudentRegisterReport> students = studentReportService
                    .searchStudentRegisterData(schoolId, academicYear, searchTerm);

            log.info("✅ Found {} students matching search term '{}'", students.size(), searchTerm);
            return ResponseEntity.ok(students);

        } catch (Exception e) {
            log.error("❌ Error searching student register data: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error searching student register data: " + e.getMessage()));
        }
    }

    // Get available standards
    @GetMapping("/school/{schoolId}/standards")
    public ResponseEntity<?> getAvailableStandards(
            @PathVariable String schoolId,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📊 Fetching available standards for school: {}, academic year: {}", schoolId, academicYear);

            List<String> standards = studentReportService.getAvailableStandards(schoolId, academicYear);

            log.info("✅ Found {} available standards", standards.size());
            return ResponseEntity.ok(standards);

        } catch (Exception e) {
            log.error("❌ Error fetching available standards: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching available standards: " + e.getMessage()));
        }
    }

    // Get statistics
    @GetMapping("/school/{schoolId}/statistics")
    public ResponseEntity<?> getStudentRegisterStatistics(
            @PathVariable String schoolId,
            @RequestParam("academicYear") String academicYear) {

        try {
            log.info("📈 Fetching student register statistics for school: {}, academic year: {}", schoolId, academicYear);

            Map<String, Object> statistics = studentReportService.getStudentRegisterStatistics(schoolId, academicYear);

            log.info("✅ Successfully fetched student register statistics");
            return ResponseEntity.ok(statistics);

        } catch (Exception e) {
            log.error("❌ Error fetching student register statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching student register statistics: " + e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Student Register Report Service is running");
    }
}