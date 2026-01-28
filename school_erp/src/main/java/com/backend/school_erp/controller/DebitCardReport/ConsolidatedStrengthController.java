package com.backend.school_erp.controller.DebitCardReport;

import com.backend.school_erp.DTO.DebitCardReport.ConsolidatedStrengthDTO;
import com.backend.school_erp.service.DebitCardReport.ConsolidatedStrengthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ConsolidatedStrengthController {

    @Autowired
    private ConsolidatedStrengthService consolidatedStrengthService;

    @GetMapping("/consolidated-strength")
    public ResponseEntity<List<ConsolidatedStrengthDTO>> getConsolidatedStrength(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {

        List<ConsolidatedStrengthDTO> report = consolidatedStrengthService.getConsolidatedStrength(schoolId, academicYear);
        return ResponseEntity.ok(report);
    }
}