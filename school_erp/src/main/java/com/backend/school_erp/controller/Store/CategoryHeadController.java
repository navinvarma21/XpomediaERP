package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.CategoryHeadDTO;
import com.backend.school_erp.entity.Store.CategoryHead;
import com.backend.school_erp.service.Store.CategoryHeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/store/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CategoryHeadController {
    private final CategoryHeadService service;

    @GetMapping
    public ResponseEntity<List<CategoryHead>> getCategoryHeads(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(service.getCategoryHeads(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<CategoryHead> createCategoryHead(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody CategoryHeadDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.addCategoryHead(schoolId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryHead> updateCategoryHead(
            @RequestParam String schoolId,
            @RequestParam String year,
            @PathVariable Long id,
            @RequestBody CategoryHeadDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.updateCategoryHead(schoolId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategoryHead(
            @RequestParam String schoolId,
            @PathVariable Long id
    ) {
        service.deleteCategoryHead(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}