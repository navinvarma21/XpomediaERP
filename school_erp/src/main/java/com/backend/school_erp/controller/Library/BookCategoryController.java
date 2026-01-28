package com.backend.school_erp.controller.Library;

import com.backend.school_erp.DTO.Library.BookCategoryDTO;
import com.backend.school_erp.entity.Library.BookCategory;
import com.backend.school_erp.service.Library.BookCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/library/categories")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Slf4j
public class BookCategoryController {

    private final BookCategoryService bookCategoryService;

    @GetMapping
    public ResponseEntity<List<BookCategory>> getCategories(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(bookCategoryService.getCategories(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<BookCategory> addCategory(@RequestBody BookCategoryDTO dto) {
        BookCategory created = bookCategoryService.addCategory(dto.getSchoolId(), dto);
        return ResponseEntity.created(URI.create("/api/library/categories/" + created.getId()))
                .body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody BookCategoryDTO dto) {
        return bookCategoryService.updateCategory(dto.getSchoolId(), id, dto.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id, @RequestParam String schoolId) {
        boolean deleted = bookCategoryService.deleteCategory(schoolId, id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}