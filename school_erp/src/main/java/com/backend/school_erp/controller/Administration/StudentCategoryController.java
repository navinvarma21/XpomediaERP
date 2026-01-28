package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.StudentCategoryDTO;
import com.backend.school_erp.entity.Administration.StudentCategory;
import com.backend.school_erp.service.Administration.StudentCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administration/studentcategory")
@RequiredArgsConstructor
public class StudentCategoryController {

    private final StudentCategoryService service;

    // GET all categories for a school + academic year
    @GetMapping("/{schoolId}/{academicYear}")
    public ResponseEntity<List<StudentCategory>> getCategories(
            @PathVariable String schoolId,
            @PathVariable String academicYear
    ) {
        return ResponseEntity.ok(service.getCategories(schoolId, academicYear));
    }

    // POST: Add category
    @PostMapping
    public ResponseEntity<StudentCategory> addCategory(
            @RequestParam String schoolId,
            @RequestBody StudentCategoryDTO dto
    ) {
        return ResponseEntity.ok(service.addCategory(schoolId, dto));
    }

    // PUT: Update category
    @PutMapping("/{id}")
    public ResponseEntity<StudentCategory> updateCategory(
            @PathVariable Long id,
            @RequestParam String schoolId,
            @RequestBody StudentCategoryDTO dto
    ) {
        return ResponseEntity.ok(service.updateCategory(schoolId, id, dto.getStudentCategoryName()));
    }

    // DELETE: Delete category
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id,
            @RequestParam String schoolId
    ) {
        service.deleteCategory(schoolId, id);
        return ResponseEntity.ok().build();
    }
}
