package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.TuitionFeeSetupDTO;
import com.backend.school_erp.entity.Administration.TuitionFeeSetup;
import com.backend.school_erp.service.Administration.TuitionFeeSetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/administration/tutionfeesetup") // match React spelling
@RequiredArgsConstructor
public class TuitionFeeSetupController {

    private final TuitionFeeSetupService service;

    // --- CRUD Endpoints ---

    @GetMapping("/fees")
    public List<TuitionFeeSetup> getTuitionFees(
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        return service.getTuitionFees(schoolId, academicYear);
    }

    @PostMapping("/fees")
    public TuitionFeeSetup addTuitionFee(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestBody TuitionFeeSetupDTO dto
    ) {
        return service.addTuitionFee(schoolId, dto, academicYear);
    }

    @PutMapping("/fees/{id}")
    public TuitionFeeSetup updateTuitionFee(
            @PathVariable Long id,
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestBody TuitionFeeSetupDTO dto
    ) {
        return service.updateTuitionFee(schoolId, id, dto, academicYear);
    }

    @DeleteMapping("/fees/{id}")
    public void deleteTuitionFee(
            @PathVariable Long id,
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        service.deleteTuitionFee(schoolId, id, academicYear);
    }

    // --- Dropdowns ---

    @GetMapping("/courses")
    public List<Map<String, Object>> getCourses(
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        return service.getCourses(schoolId, academicYear);
    }

    @GetMapping("/student-categories")
    public List<Map<String, Object>> getStudentCategories(
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        return service.getStudentCategories(schoolId, academicYear);
    }

    @GetMapping("/fee-headings")
    public List<Map<String, Object>> getFeeHeadings(
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        return service.getFeeHeadings(schoolId, academicYear);
    }
}
