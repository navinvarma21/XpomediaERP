package com.backend.school_erp.controller.AdmissionMaster;

import com.backend.school_erp.entity.AdmissionMaster.StudentDetails;
import com.backend.school_erp.service.AdmissionMaster.StudentDetailsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admissionmaster/studentreport")
@Slf4j
public class StudentDetailsController {

    private final StudentDetailsService studentDetailsService;

    public StudentDetailsController(StudentDetailsService studentDetailsService) {
        this.studentDetailsService = studentDetailsService;
    }

    @GetMapping("/datas")
    public ResponseEntity<?> getAllStudentDetails(
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear) {
        try {
            List<StudentDetails> students = studentDetailsService.getAllStudentDetails(schoolId, academicYear);
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{admissionNumber}")
    public ResponseEntity<?> getStudentByAdmissionNumber(
            @PathVariable String admissionNumber,
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear) {
        try {
            StudentDetails student = studentDetailsService.getStudentByAdmissionNumber(schoolId, admissionNumber, academicYear);
            if (student == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Student not found"));
            }
            return ResponseEntity.ok(student);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}