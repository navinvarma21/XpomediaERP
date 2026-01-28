package com.backend.school_erp.controller.Teacher.Academic;

import com.backend.school_erp.DTO.Teacher.Academic.AcademicYearDTO;
import com.backend.school_erp.DTO.Teacher.Academic.ActiveSessionDTO;
import com.backend.school_erp.DTO.Teacher.Academic.TermDTO;
import com.backend.school_erp.entity.Teacher.Academic.AcademicYear;
import com.backend.school_erp.entity.Teacher.Academic.Section; // Import Section
import com.backend.school_erp.entity.Teacher.Academic.Term;
import com.backend.school_erp.service.Teacher.Academic.AcademicYearService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teachers/academicyear")
public class AcademicYearController {

    private final AcademicYearService service;

    public AcademicYearController(AcademicYearService service) {
        this.service = service;
    }

    @PostMapping("/init-tables")
    public ResponseEntity<?> initTables(@RequestHeader("X-School-ID") String schoolId) {
        service.ensureTableStructure(schoolId);
        return ResponseEntity.ok("Tables initialized");
    }

    @GetMapping("/all")
    public ResponseEntity<List<AcademicYear>> getAllYears(@RequestHeader("X-School-ID") String schoolId) {
        return ResponseEntity.ok(service.getAllAcademicYears(schoolId));
    }

    @GetMapping("/active-info")
    public ResponseEntity<ActiveSessionDTO> getActiveInfo(@RequestHeader("X-School-ID") String schoolId) {
        return ResponseEntity.ok(service.getActiveSession(schoolId));
    }

    @GetMapping("/terms/{year}")
    public ResponseEntity<List<Term>> getTerms(@RequestHeader("X-School-ID") String schoolId, @PathVariable String year) {
        return ResponseEntity.ok(service.getTermsForYear(schoolId, year));
    }

    // --- NEW: Get Sections Endpoint ---
    @GetMapping("/sections/{year}")
    public ResponseEntity<List<Section>> getSections(@RequestHeader("X-School-ID") String schoolId, @PathVariable String year) {
        return ResponseEntity.ok(service.getSectionsForYear(schoolId, year));
    }

    @PostMapping("/set-active")
    public ResponseEntity<?> setActive(@RequestHeader("X-School-ID") String schoolId, @RequestBody Map<String, Object> payload) {
        String year = (String) payload.get("year");

        // Safe conversion for Term ID
        Object termIdObj = payload.get("termId");
        Long termId = (termIdObj != null && !termIdObj.toString().isEmpty())
                ? Long.valueOf(termIdObj.toString()) : null;

        // Safe conversion for Section ID (Handles empty string from frontend)
        Object sectionIdObj = payload.get("sectionId");
        Long sectionId = (sectionIdObj != null && !sectionIdObj.toString().isEmpty())
                ? Long.valueOf(sectionIdObj.toString()) : null;

        service.setActiveSession(schoolId, year, termId, sectionId);
        return ResponseEntity.ok("Active session updated");
    }

    @PostMapping("/terms")
    public ResponseEntity<?> createTerms(@RequestHeader("X-School-ID") String schoolId, @RequestBody AcademicYearDTO dto) {
        service.createTerms(schoolId, dto);
        return ResponseEntity.ok("Terms created");
    }

    @PutMapping("/terms/{id}")
    public ResponseEntity<?> updateTerm(@RequestHeader("X-School-ID") String schoolId, @PathVariable Long id, @RequestBody TermDTO termDTO) {
        service.updateTerm(schoolId, id, termDTO);
        return ResponseEntity.ok("Term updated");
    }

    @DeleteMapping("/terms/{id}")
    public ResponseEntity<?> deleteTerm(@RequestHeader("X-School-ID") String schoolId, @PathVariable Long id) {
        service.deleteTerm(schoolId, id);
        return ResponseEntity.ok("Term deleted");
    }
}