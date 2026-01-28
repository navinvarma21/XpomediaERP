package com.backend.school_erp.controller.Transport;

import com.backend.school_erp.DTO.Transport.DriverDTO;
import com.backend.school_erp.entity.Transport.Driver;
import com.backend.school_erp.service.Transport.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transport/drivers")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DriverController {
    private final DriverService service;

    @GetMapping
    public ResponseEntity<List<Driver>> getDrivers(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(service.getDrivers(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<Driver> createDriver(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody DriverDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.addDriver(schoolId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Driver> updateDriver(
            @RequestParam String schoolId,
            @RequestParam String year,
            @PathVariable Long id,
            @RequestBody DriverDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.updateDriver(schoolId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDriver(
            @RequestParam String schoolId,
            @PathVariable Long id
    ) {
        service.deleteDriver(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}