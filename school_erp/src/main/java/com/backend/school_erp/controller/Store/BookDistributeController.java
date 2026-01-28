package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.BookDistributionDTO;
import com.backend.school_erp.service.Store.BookDistributeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/store/distribute")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowedHeaders = "*", allowCredentials = "true")
public class BookDistributeController {

    @Autowired
    private BookDistributeService distributeService;

    // Grid 1 Data Source
    @GetMapping("/setup-items")
    public ResponseEntity<?> getSetupItems(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String standard) {
        try {
            List<Map<String, Object>> items = distributeService.getSetupItemsForStandard(schoolId, academicYear, standard);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Grid 2 Data Source
    @GetMapping("/student-history")
    public ResponseEntity<?> getStudentHistory(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String admissionNo) {
        try {
            List<Map<String, Object>> history = distributeService.getStudentTransactionHistory(schoolId, academicYear, admissionNo);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Save Action
    @PostMapping("/save")
    public ResponseEntity<?> saveDistribution(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestBody BookDistributionDTO dto) {
        try {
            String billNo = distributeService.saveDistribution(schoolId, academicYear, dto);
            return ResponseEntity.ok().body(Map.of("status", "success", "billNo", billNo));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("status", "error", "message", "Server Error"));
        }
    }
}