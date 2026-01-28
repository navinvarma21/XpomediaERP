package com.backend.school_erp.controller.Transport;

import com.backend.school_erp.DTO.Transport.PlaceDTO;
import com.backend.school_erp.entity.Transport.Place;
import com.backend.school_erp.service.Transport.PlaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transport/places")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PlaceController {
    private final PlaceService service;

    @GetMapping
    public ResponseEntity<List<Place>> getPlaces(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(service.getPlaces(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<Place> createPlace(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody PlaceDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.addPlace(schoolId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Place> updatePlace(
            @RequestParam String schoolId,
            @RequestParam String year,
            @PathVariable Long id,
            @RequestBody PlaceDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.updatePlace(schoolId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlace(
            @RequestParam String schoolId,
            @PathVariable Long id
    ) {
        service.deletePlace(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}