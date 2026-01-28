package com.backend.school_erp.controller.DebitCardReport;

import com.backend.school_erp.DTO.DebitCardReport.TrialBalanceResponseDTO;
import com.backend.school_erp.service.DebitCardReport.ReportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
@Slf4j
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/debit-credit/trial-balance")
    public ResponseEntity<List<TrialBalanceResponseDTO>> getTrialBalance(
            @RequestParam String schoolId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam String type, // "ACADEMIC" or "MISC"
            @RequestParam String academicYear // Added academicYear param
    ) {
        try {
            log.info("Generating Trial Balance for School: {}, Type: {}, Date: {} to {}, Year: {}",
                    schoolId, type, fromDate, toDate, academicYear);

            // 1. Get raw data from Service (List of Maps)
            List<Map<String, Object>> rawData = reportService.getTrialBalance(schoolId, fromDate, toDate, academicYear, type);

            // 2. Map to DTO for safe Frontend consumption
            List<TrialBalanceResponseDTO> response = rawData.stream()
                    .map(row -> TrialBalanceResponseDTO.builder()
                            .ledgerName((String) row.getOrDefault("ledgerName", "Unknown Ledger"))
                            .totalReceipt(convertToDouble(row.get("totalReceipt")))
                            .totalPayment(convertToDouble(row.get("totalPayment")))
                            .isSystemRow((Boolean) row.getOrDefault("isSystemRow", false))
                            .build())
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error in Trial Balance API: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // Helper to safely convert Number/String to Double
    private Double convertToDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}