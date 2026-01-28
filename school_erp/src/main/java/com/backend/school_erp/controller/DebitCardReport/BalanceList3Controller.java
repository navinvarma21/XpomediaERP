package com.backend.school_erp.controller.DebitCardReport;

import com.backend.school_erp.DTO.DebitCardReport.BalanceList3DTO;
import com.backend.school_erp.service.DebitCardReport.BalanceList3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class BalanceList3Controller {

    @Autowired
    private BalanceList3Service balanceList3Service;

    // Report Generation Endpoint
    @GetMapping("/balance-list-3")
    public ResponseEntity<?> getBalanceList3(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(required = false) List<String> feeHead,
            @RequestParam(defaultValue = "false") boolean includeMisc) {

        try {
            List<BalanceList3DTO> reportData = balanceList3Service.generateBalanceList3(
                    schoolId, academicYear, feeHead, includeMisc
            );
            return ResponseEntity.ok(reportData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Endpoint to get grouped Fee Heads
    @GetMapping("/balance-list-3/heads")
    public ResponseEntity<?> getFeeHeadsForDropdown(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(defaultValue = "false") boolean includeMisc) {
        try {
            Map<String, List<String>> heads = balanceList3Service.getGroupedFeeHeads(schoolId, academicYear, includeMisc);
            return ResponseEntity.ok(heads);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}