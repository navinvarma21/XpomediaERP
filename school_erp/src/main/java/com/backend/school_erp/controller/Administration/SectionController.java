package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.SectionDTO;
import com.backend.school_erp.entity.Administration.Section;
import com.backend.school_erp.service.Administration.SectionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administration/sections")
public class SectionController {

    @Autowired
    private SectionService sectionService;

    @GetMapping
    public ResponseEntity<List<Section>> getSections(
            @RequestHeader("X-School-Id") String schoolId,
            @RequestHeader("X-Academic-Year") String academicYear) {

        List<Section> sections = sectionService.getSections(schoolId, academicYear);
        return ResponseEntity.ok(sections);
    }

    @PostMapping
    public ResponseEntity<Section> addSection(
            @RequestHeader("X-School-Id") String schoolId,
            @RequestHeader("X-Academic-Year") String academicYear,
            @RequestBody @Valid SectionDTO dto) {

        dto.setAcademicYear(academicYear);
        Section created = sectionService.addSection(schoolId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Section> updateSection(
            @RequestHeader("X-School-Id") String schoolId,
            @PathVariable Long id,
            @RequestBody @Valid SectionDTO dto) {

        Section updated = sectionService.updateSection(schoolId, id, dto.getSection());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSection(
            @RequestHeader("X-School-Id") String schoolId,
            @PathVariable Long id) {

        sectionService.deleteSection(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}
