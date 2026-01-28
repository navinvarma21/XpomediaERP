package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.SupplierDTO;
import com.backend.school_erp.entity.Store.Supplier;
import com.backend.school_erp.service.Store.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/store/suppliers")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SupplierController {
    private final SupplierService service;

    @GetMapping
    public ResponseEntity<List<Supplier>> getSuppliers(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(service.getSuppliers(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<Supplier> createSupplier(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody SupplierDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.addSupplier(schoolId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Supplier> updateSupplier(
            @RequestParam String schoolId,
            @RequestParam String year,
            @PathVariable Long id,
            @RequestBody SupplierDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.updateSupplier(schoolId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupplier(
            @RequestParam String schoolId,
            @PathVariable Long id
    ) {
        service.deleteSupplier(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}