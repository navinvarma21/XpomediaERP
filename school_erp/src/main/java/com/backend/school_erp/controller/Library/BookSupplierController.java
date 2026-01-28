package com.backend.school_erp.controller.Library;

import com.backend.school_erp.DTO.Library.BookSupplierDTO;
import com.backend.school_erp.entity.Library.BookSupplier;
import com.backend.school_erp.service.Library.BookSupplierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/library/booksuppliers")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Slf4j
public class BookSupplierController {

    private final BookSupplierService bookSupplierService;

    @GetMapping
    public ResponseEntity<List<BookSupplier>> getBookSuppliers(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        try {
            List<BookSupplier> suppliers = bookSupplierService.getBookSuppliers(schoolId, year);
            return ResponseEntity.ok(suppliers);
        } catch (Exception e) {
            log.error("Error fetching book suppliers: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<BookSupplier> createBookSupplier(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody BookSupplierDTO dto
    ) {
        try {
            dto.setAcademicYear(year);
            BookSupplier supplier = bookSupplierService.addBookSupplier(schoolId, dto);
            return ResponseEntity.ok(supplier);
        } catch (Exception e) {
            log.error("Error creating book supplier: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookSupplier> updateBookSupplier(
            @RequestParam String schoolId,
            @RequestParam String year,
            @PathVariable Long id,
            @RequestBody BookSupplierDTO dto
    ) {
        try {
            dto.setAcademicYear(year);
            BookSupplier supplier = bookSupplierService.updateBookSupplier(schoolId, id, dto);
            return ResponseEntity.ok(supplier);
        } catch (RuntimeException e) {
            log.error("Error updating book supplier: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error updating book supplier: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBookSupplier(
            @PathVariable Long id,
            @RequestParam String schoolId
    ) {
        try {
            bookSupplierService.deleteBookSupplier(schoolId, id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting book supplier: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error deleting book supplier: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}