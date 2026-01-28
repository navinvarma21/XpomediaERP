package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.MaterialIssueDTO;
import com.backend.school_erp.service.Store.UtiliseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/store/utilise")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowedHeaders = "*", allowCredentials = "true")
public class UtiliseController {

    private final UtiliseService service;

    @GetMapping("/items-stock")
    public ResponseEntity<List<Map<String, Object>>> getItemsWithStock(
            @RequestParam String schoolId) {
        return ResponseEntity.ok(service.getAllItemsWithStock(schoolId));
    }

    @GetMapping("/next-bill")
    public ResponseEntity<Map<String, String>> getNextBillNo(@RequestParam String schoolId) {
        return ResponseEntity.ok(Map.of("billNo", service.generateBillNo(schoolId)));
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveIssue(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody MaterialIssueDTO dto) {
        try {
            String billNo = service.saveMaterialIssue(schoolId, year, dto);
            return ResponseEntity.ok(Map.of("status", "success", "billNo", billNo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}