package com.backend.school_erp.controller.Transport;

import com.backend.school_erp.DTO.Transport.BusVanFeeHeadDTO;
import com.backend.school_erp.entity.Transport.BusVanFeeHead;
import com.backend.school_erp.service.Transport.BusVanFeeHeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transport/busVanFeeHeads")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BusVanFeeHeadController {

    private final BusVanFeeHeadService service;

    @GetMapping
    public ResponseEntity<List<BusVanFeeHead>> getBusVanFeeHeads(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(service.getBusVanFeeHeads(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<BusVanFeeHead> createBusVanFeeHead(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody BusVanFeeHeadDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.addBusVanFeeHead(schoolId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusVanFeeHead> updateBusVanFeeHead(
            @RequestParam String schoolId,
            @RequestParam String year,
            @PathVariable Long id,
            @RequestBody BusVanFeeHeadDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.updateBusVanFeeHead(schoolId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBusVanFeeHead(
            @RequestParam String schoolId,
            @PathVariable Long id
    ) {
        service.deleteBusVanFeeHead(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}