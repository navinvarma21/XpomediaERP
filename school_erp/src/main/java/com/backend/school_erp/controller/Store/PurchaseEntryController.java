package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.PurchaseEntryDTO;
import com.backend.school_erp.service.Store.PurchaseEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/store/purchase-entry")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PurchaseEntryController {

    private final PurchaseEntryService service;

    @GetMapping("/next-entry")
    public ResponseEntity<Map<String, String>> getNextEntryNo(@RequestParam String schoolId) {
        return ResponseEntity.ok(Map.of("entryNo", service.generateEntryNo(schoolId)));
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveEntry(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody PurchaseEntryDTO dto) {
        try {
            String entryNo = service.savePurchaseEntry(schoolId, year, dto);
            return ResponseEntity.ok(Map.of("status", "success", "entryNo", entryNo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}