package com.backend.school_erp.controller.DebitCardReport;

import com.backend.school_erp.DTO.DebitCardReport.PromotionCandidateDTO;
import com.backend.school_erp.DTO.DebitCardReport.PromotionRequestDTO;
import com.backend.school_erp.service.DebitCardReport.PromotionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/promotion")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    // NEW ENDPOINT: Fetch academic years from the DB table
    @GetMapping("/academic-years")
    public ResponseEntity<List<String>> getAcademicYears(@RequestParam String schoolId) {
        return ResponseEntity.ok(promotionService.getAcademicYears(schoolId));
    }

    @GetMapping("/candidates")
    public ResponseEntity<List<PromotionCandidateDTO>> getCandidates(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String standard,
            @RequestParam String section,
            @RequestParam(required = false) String targetAcademicYear) { // Added targetAcademicYear param
        return ResponseEntity.ok(promotionService.getCandidatesForPromotion(schoolId, academicYear, standard, section, targetAcademicYear));
    }

    @PostMapping("/execute")
    public ResponseEntity<?> executePromotion(@RequestBody PromotionRequestDTO request) {
        try {
            int count = promotionService.promoteStudents(request);
            return ResponseEntity.ok(Map.of("message", "Promotion successful", "promotedCount", count));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Promotion failed: " + e.getMessage());
        }
    }
}