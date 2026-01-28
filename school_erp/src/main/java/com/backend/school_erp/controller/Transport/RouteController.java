package com.backend.school_erp.controller.Transport;

import com.backend.school_erp.DTO.Transport.RouteDTO;
import com.backend.school_erp.entity.Transport.Route;
import com.backend.school_erp.service.Transport.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transport/routes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class RouteController {
    private final RouteService service;

    @GetMapping
    public ResponseEntity<List<Route>> getRoutes(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(service.getRoutes(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<Route> createRoute(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody RouteDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.addRoute(schoolId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Route> updateRoute(
            @RequestParam String schoolId,
            @RequestParam String year,
            @PathVariable Long id,
            @RequestBody RouteDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.updateRoute(schoolId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoute(
            @RequestParam String schoolId,
            @PathVariable Long id
    ) {
        service.deleteRoute(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}