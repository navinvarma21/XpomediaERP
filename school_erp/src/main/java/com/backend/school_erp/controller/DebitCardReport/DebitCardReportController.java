package com.backend.school_erp.controller.DebitCardReport;

import com.backend.school_erp.DTO.DebitCardReport.LedgerReportDTO;
import com.backend.school_erp.service.DebitCardReport.DebitCardReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports/debit-credit")
@RequiredArgsConstructor
public class DebitCardReportController {

    private final DebitCardReportService service;

    @GetMapping("/day-ledger")
    public ResponseEntity<List<LedgerReportDTO>> getDayLedger(
            @RequestParam String schoolId,
            @RequestParam String date,
            @RequestParam String academicYear, // Added Param
            @RequestParam(defaultValue = "ACADEMIC") String type) {
        return ResponseEntity.ok(service.getDayLedger(schoolId, date, academicYear, type));
    }

    @GetMapping("/period-ledger")
    public ResponseEntity<List<LedgerReportDTO>> getPeriodLedger(
            @RequestParam String schoolId,
            @RequestParam String fromDate,
            @RequestParam String toDate,
            @RequestParam String academicYear, // Added Param
            @RequestParam(required = false) String head,
            @RequestParam(defaultValue = "ACADEMIC") String type) {
        return ResponseEntity.ok(service.getPeriodLedger(schoolId, fromDate, toDate, head, academicYear, type));
    }

    @GetMapping("/bank-ledger")
    public ResponseEntity<List<LedgerReportDTO>> getBankLedger(
            @RequestParam String schoolId,
            @RequestParam String fromDate,
            @RequestParam String toDate,
            @RequestParam String academicYear, // Added Param
            @RequestParam(required = false) String head,
            @RequestParam(defaultValue = "ACADEMIC") String type) {
        return ResponseEntity.ok(service.getBankLedger(schoolId, fromDate, toDate, head, academicYear, type));
    }

    @GetMapping("/expenses")
    public ResponseEntity<List<LedgerReportDTO>> getExpenses(
            @RequestParam String schoolId,
            @RequestParam String fromDate,
            @RequestParam String toDate,
            @RequestParam String mode,
            @RequestParam String academicYear, // Added Param
            @RequestParam(defaultValue = "ACADEMIC") String type) {
        return ResponseEntity.ok(service.getExpenses(schoolId, fromDate, toDate, mode, academicYear, type));
    }

    @GetMapping("/heads")
    public ResponseEntity<List<String>> getLedgerHeads(
            @RequestParam String schoolId,
            @RequestParam String academicYear, // Added Param
            @RequestParam(defaultValue = "ACADEMIC") String type) {
        return ResponseEntity.ok(service.getUniqueHeads(schoolId, academicYear, type));
    }
}