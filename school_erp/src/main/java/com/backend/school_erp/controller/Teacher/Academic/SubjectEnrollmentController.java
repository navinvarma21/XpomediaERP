package com.backend.school_erp.controller.Teacher.Academic;

import com.backend.school_erp.DTO.Teacher.Academic.SubjectEnrollmentDTO;
import com.backend.school_erp.service.Teacher.Academic.SubjectEnrollmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teacherams/subjectenrollment")
public class SubjectEnrollmentController {

    @Autowired
    private SubjectEnrollmentService service;

    @PostMapping("/save")
    public ResponseEntity<?> saveSubjects(
            @RequestHeader("X-School-ID") String schoolId,
            @RequestBody SubjectEnrollmentDTO dto) {
        service.saveSubjects(schoolId, dto);
        return ResponseEntity.ok("Subjects saved successfully");
    }

    @GetMapping("/get")
    public ResponseEntity<SubjectEnrollmentDTO> getSubjects(
            @RequestHeader("X-School-ID") String schoolId,
            @RequestParam String academicYear,
            @RequestParam String term,
            @RequestParam String standard,
            @RequestParam(required = false, defaultValue = "") String section) {

        return ResponseEntity.ok(service.getSubjects(schoolId, academicYear, term, standard, section));
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateSubjects(
            @RequestHeader("X-School-ID") String schoolId,
            @RequestBody SubjectEnrollmentDTO dto) {
        service.updateSubjects(schoolId, dto);
        return ResponseEntity.ok("Subjects updated successfully");
    }
}