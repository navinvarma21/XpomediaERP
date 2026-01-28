package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.FeeHeadDTO;
import com.backend.school_erp.entity.Administration.FeeHead;
import com.backend.school_erp.service.Administration.FeeHeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administration/feeHeads")
@RequiredArgsConstructor
public class FeeHeadController {

    private final FeeHeadService service;

    @GetMapping
    public ResponseEntity<List<FeeHead>> getFeeHeads(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(service.getFeeHeads(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<FeeHead> createFeeHead(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody FeeHeadDTO dto
    ) {
        dto.setAcademicYear(year); // ✅ ensure academicYear is set
        return ResponseEntity.ok(service.addFeeHead(schoolId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FeeHead> updateFeeHead(
            @RequestParam String schoolId,
            @RequestParam String year,
            @PathVariable Long id,
            @RequestBody FeeHeadDTO dto
    ) {
        dto.setAcademicYear(year); // ✅ ensure academicYear is set
        return ResponseEntity.ok(service.updateFeeHead(schoolId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeeHead(
            @RequestParam String schoolId,
            @PathVariable Long id
    ) {
        service.deleteFeeHead(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}
