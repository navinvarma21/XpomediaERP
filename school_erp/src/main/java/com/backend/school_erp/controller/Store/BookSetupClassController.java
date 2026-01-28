package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.BookSetupClassDTO;
import com.backend.school_erp.entity.Store.BookSetupClass;
import com.backend.school_erp.service.Store.BookSetupClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/store/book-setup-classes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BookSetupClassController {
    private final BookSetupClassService service;

    @GetMapping
    public ResponseEntity<List<BookSetupClass>> getBookSetupClasses(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        // If a date is provided, filter by date
        if (date != null) {
            return ResponseEntity.ok(service.getBookSetupClassesByDate(schoolId, year, date));
        }
        // Otherwise return all
        return ResponseEntity.ok(service.getBookSetupClasses(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<?> createBookSetupClass(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody BookSetupClassDTO dto
    ) {
        try {
            dto.setAcademicYear(year);
            service.saveBookSetupClass(schoolId, dto);
            return ResponseEntity.ok("Saved Successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to save: " + e.getMessage());
        }
    }

    // ADD THIS NEW METHOD FOR UPDATING
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBookSetupClass(
            @RequestParam String schoolId,
            @PathVariable Long id,
            @RequestBody BookSetupClass updatedData
    ) {
        try {
            service.updateBookSetupClass(schoolId, id, updatedData);
            return ResponseEntity.ok("Updated Successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBookSetupClass(
            @RequestParam String schoolId,
            @PathVariable Long id
    ) {
        service.deleteBookSetupClass(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}