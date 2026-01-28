package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.StoreUnitDTO;
import com.backend.school_erp.entity.Store.StoreUnit;
import com.backend.school_erp.service.Store.StoreUnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/store/units")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class StoreUnitController {
    private final StoreUnitService service;

    @GetMapping
    public ResponseEntity<List<StoreUnit>> getUnits(@RequestParam String schoolId, @RequestParam String year) {
        return ResponseEntity.ok(service.getUnits(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<StoreUnit> createUnit(@RequestParam String schoolId, @RequestParam String year, @RequestBody StoreUnitDTO dto) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.addUnit(schoolId, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUnit(@RequestParam String schoolId, @PathVariable Long id) {
        service.deleteUnit(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}