package com.backend.school_erp.controller.DebitCardReport;

import com.backend.school_erp.DTO.DebitCardReport.BalanceList2DTO;
import com.backend.school_erp.DTO.DebitCardReport.BalanceListDTO;
import com.backend.school_erp.service.DebitCardReport.BalanceListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class BalanceListController {

    @Autowired
    private BalanceListService balanceListService;

    // 1. New Endpoint: Fetch Fee Heads for Dropdown
    @GetMapping("/fee-heads")
    public ResponseEntity<?> getFeeHeads(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            List<String> feeHeads = balanceListService.getFeeHeads(schoolId, academicYear);
            return ResponseEntity.ok(feeHeads);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch fee heads: " + e.getMessage()));
        }
    }

    // 2. Updated: Balance List 1 (Summary) with optional Fee Head Filter
    @GetMapping("/balance-list-1")
    public ResponseEntity<?> getBalanceList1(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(required = false) String feeHead) { // Added optional filter
        try {
            List<BalanceListDTO> reportData = balanceListService.generateBalanceList1(schoolId, academicYear, feeHead);
            return ResponseEntity.ok(reportData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 3. Updated: Balance List 2 (Detailed) with optional Fee Head Filter
    @GetMapping("/balance-list-2")
    public ResponseEntity<?> getBalanceList2(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(required = false) String feeHead) { // Added optional filter
        try {
            List<BalanceList2DTO> reportData = balanceListService.generateBalanceList2(schoolId, academicYear, feeHead);
            return ResponseEntity.ok(reportData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to generate Balance List 2: " + e.getMessage()));
        }
    }
}