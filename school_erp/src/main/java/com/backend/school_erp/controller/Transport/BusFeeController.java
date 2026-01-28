package com.backend.school_erp.controller.Transport;

import com.backend.school_erp.DTO.Transport.BusFeeDTO;
import com.backend.school_erp.entity.Transport.BusFee;
import com.backend.school_erp.service.Transport.BusFeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transport/busFees")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BusFeeController {
    private final BusFeeService service;

    @GetMapping
    public ResponseEntity<List<BusFee>> getBusFees(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(service.getBusFees(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<BusFee> createBusFee(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody BusFeeDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.addBusFee(schoolId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusFee> updateBusFee(
            @RequestParam String schoolId,
            @RequestParam String year,
            @PathVariable Long id,
            @RequestBody BusFeeDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.updateBusFee(schoolId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBusFee(
            @RequestParam String schoolId,
            @PathVariable Long id
    ) {
        service.deleteBusFee(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}