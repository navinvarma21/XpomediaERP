package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.MiscellaneousFeeHeadDTO;
import com.backend.school_erp.entity.Administration.MiscellaneousFeeHead;
import com.backend.school_erp.service.Administration.MiscellaneousFeeHeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administration/miscellaneousFeeHeads")
@RequiredArgsConstructor
public class MiscellaneousFeeHeadController {

    private final MiscellaneousFeeHeadService service;

    @GetMapping
    public ResponseEntity<List<MiscellaneousFeeHead>> getMiscellaneousFeeHeads(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(service.getMiscellaneousFeeHeads(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<MiscellaneousFeeHead> createMiscellaneousFeeHead(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody MiscellaneousFeeHeadDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.addMiscellaneousFeeHead(schoolId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MiscellaneousFeeHead> updateMiscellaneousFeeHead(
            @RequestParam String schoolId,
            @RequestParam String year,
            @PathVariable Long id,
            @RequestBody MiscellaneousFeeHeadDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.updateMiscellaneousFeeHead(schoolId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMiscellaneousFeeHead(
            @RequestParam String schoolId,
            @PathVariable Long id
    ) {
        service.deleteMiscellaneousFeeHead(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}