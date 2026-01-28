package com.backend.school_erp.controller.DebitCardReport;

import com.backend.school_erp.DTO.DebitCardReport.BalanceList4DTO;
import com.backend.school_erp.service.DebitCardReport.BalanceList4Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class BalanceList4Controller {

    @Autowired
    private BalanceList4Service balanceList4Service;

    // Report Generation Endpoint (INDIVIDUAL STUDENTS)
    @GetMapping("/balance-list-4")
    public ResponseEntity<?> getBalanceList4(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(required = false) List<String> feeHead, // LIST
            @RequestParam(defaultValue = "false") boolean includeMisc) {

        try {
            List<BalanceList4DTO> reportData = balanceList4Service.generateBalanceList4(
                    schoolId, academicYear, feeHead, includeMisc
            );
            return ResponseEntity.ok(reportData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Endpoint to get grouped Fee Heads
    @GetMapping("/balance-list-4/heads")
    public ResponseEntity<?> getFeeHeadsForDropdown(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(defaultValue = "false") boolean includeMisc) {
        try {
            Map<String, List<String>> heads = balanceList4Service.getGroupedFeeHeads(schoolId, academicYear, includeMisc);
            return ResponseEntity.ok(heads);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}