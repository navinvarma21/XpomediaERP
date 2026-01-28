package com.backend.school_erp.controller.Transport;

import com.backend.school_erp.DTO.Transport.ConductorDTO;
import com.backend.school_erp.entity.Transport.Conductor;
import com.backend.school_erp.service.Transport.ConductorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transport/conductors")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ConductorController {
    private final ConductorService service;

    @GetMapping
    public ResponseEntity<List<Conductor>> getConductors(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(service.getConductors(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<Conductor> createConductor(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody ConductorDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.addConductor(schoolId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Conductor> updateConductor(
            @RequestParam String schoolId,
            @RequestParam String year,
            @PathVariable Long id,
            @RequestBody ConductorDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.updateConductor(schoolId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConductor(
            @RequestParam String schoolId,
            @PathVariable Long id
    ) {
        service.deleteConductor(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}