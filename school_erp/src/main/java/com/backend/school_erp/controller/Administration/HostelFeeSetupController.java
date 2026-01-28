package com.backend.school_erp.controller.Administration;

import lombok.RequiredArgsConstructor;
import com.backend.school_erp.DTO.Administration.HostelFeeSetupDTO;
import com.backend.school_erp.entity.Administration.HostelFeeSetup;
import com.backend.school_erp.service.Administration.HostelFeeSetupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/administration/hostelfee")
@RequiredArgsConstructor
public class HostelFeeSetupController {

    private final HostelFeeSetupService hostelFeeSetupService;

    @GetMapping("/hostelFees/{schoolId}/{academicYear}")
    public ResponseEntity<List<HostelFeeSetup>> getHostelFees(
            @PathVariable String schoolId,
            @PathVariable String academicYear
    ) {
        return ResponseEntity.ok(hostelFeeSetupService.getHostelFees(schoolId, academicYear));
    }

    @PostMapping("/add")
    public ResponseEntity<HostelFeeSetup> addHostelFee(
            @RequestBody HostelFeeSetupDTO dto,
            @RequestParam String schoolId
    ) {
        return ResponseEntity.ok(hostelFeeSetupService.addHostelFee(schoolId, dto));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<HostelFeeSetup> updateHostelFee(
            @PathVariable Long id,
            @RequestBody HostelFeeSetupDTO dto,
            @RequestParam String schoolId
    ) {
        return ResponseEntity.ok(hostelFeeSetupService.updateHostelFee(schoolId, id, dto));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteHostelFee(
            @PathVariable Long id,
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        hostelFeeSetupService.deleteHostelFee(schoolId, id, academicYear);
        return ResponseEntity.ok("Hostel fee deleted successfully");
    }

    // --- Dropdown endpoints ---
    @GetMapping("/courses/{schoolId}/{academicYear}")
    public ResponseEntity<List<Map<String, Object>>> getCourses(
            @PathVariable String schoolId,
            @PathVariable String academicYear
    ) {
        return ResponseEntity.ok(hostelFeeSetupService.getCourses(schoolId, academicYear));
    }

    @GetMapping("/studentCategories/{schoolId}/{academicYear}")
    public ResponseEntity<List<Map<String, Object>>> getStudentCategories(
            @PathVariable String schoolId,
            @PathVariable String academicYear
    ) {
        return ResponseEntity.ok(hostelFeeSetupService.getStudentCategories(schoolId, academicYear));
    }

    @GetMapping("/feeHeadings/{schoolId}/{academicYear}")
    public ResponseEntity<List<Map<String, Object>>> getFeeHeadings(
            @PathVariable String schoolId,
            @PathVariable String academicYear
    ) {
        return ResponseEntity.ok(hostelFeeSetupService.getFeeHeadings(schoolId, academicYear));
    }
}