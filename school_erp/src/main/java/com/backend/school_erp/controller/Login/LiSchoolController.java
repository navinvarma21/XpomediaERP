package com.backend.school_erp.controller.Login;

import com.backend.school_erp.entity.Login.LiSchool;
import com.backend.school_erp.repository.Login.LISchoolRepository;
import com.backend.school_erp.service.Login.SchoolDbService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schools")
public class LiSchoolController {

    private final LISchoolRepository schoolRepository;
    private final SchoolDbService schoolDbService;

    public LiSchoolController(LISchoolRepository schoolRepository, SchoolDbService schoolDbService) {
        this.schoolRepository = schoolRepository;
        this.schoolDbService = schoolDbService;
    }

    // Fetch school data + academic years
    @GetMapping("/{schoolId}")
    public ResponseEntity<?> getSchoolData(@PathVariable String schoolId) {
        LiSchool school = schoolRepository.findById(schoolId).orElse(null);
        if (school == null) return ResponseEntity.notFound().build();

        List<String> years = schoolDbService.getAcademicYears(schoolId);
        return ResponseEntity.ok(Map.of(
                "schoolId", school.getSchoolId(),
                "schoolName", school.getSchoolName(),
                "currentAcademicYear", school.getCurrentAcademicYear(),
                "academicYears", years
        ));
    }

    // Update current academic year
    @PutMapping("/{schoolId}/year")
    public ResponseEntity<?> setCurrentYear(@PathVariable String schoolId, @RequestBody Map<String, String> payload) {
        String year = payload.get("currentAcademicYear");
        LiSchool school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new RuntimeException("School not found"));
        school.setCurrentAcademicYear(year);
        schoolRepository.save(school);

        // Ensure year exists in school DB
        schoolDbService.addAcademicYearIfNotExists(schoolId, year);

        return ResponseEntity.ok(Map.of("currentAcademicYear", year));
    }

    // Add new academic year
    @PostMapping("/{schoolId}/years")
    public ResponseEntity<?> addAcademicYear(@PathVariable String schoolId, @RequestBody Map<String, String> payload) {
        String year = payload.get("year");
        schoolDbService.addAcademicYearIfNotExists(schoolId, year);

        List<String> years = schoolDbService.getAcademicYears(schoolId);

        // Update current year automatically
        LiSchool school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new RuntimeException("School not found"));
        school.setCurrentAcademicYear(year);
        schoolRepository.save(school);

        return ResponseEntity.ok(Map.of("academicYears", years, "currentAcademicYear", year));
    }

}
