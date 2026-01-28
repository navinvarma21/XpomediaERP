package com.backend.school_erp.controller.ReceiptPaymentReport;

import com.backend.school_erp.DTO.ReceiptPaymentReport.ExpenseReportDTO;
import com.backend.school_erp.DTO.ReceiptPaymentReport.ReceiptDetailsReportDTO;
import com.backend.school_erp.service.ReceiptPaymentReport.ReceiptPaymentReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/report/receipt-payment")
@RequiredArgsConstructor
@Slf4j
public class ReceiptPaymentReportController {

    private final ReceiptPaymentReportService receiptPaymentReportService;

    @GetMapping("/receipt-details")
    public ResponseEntity<?> getReceiptDetails(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String feeHead) {
        try {
            List<ReceiptDetailsReportDTO> data = receiptPaymentReportService.getReceiptDetails(
                    schoolId, academicYear, startDate, endDate, feeHead
            );
            double totalCollection = data.stream().mapToDouble(dto -> dto.getAmount() != null ? dto.getAmount() : 0.0).sum();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", data);
            response.put("totalCollection", totalCollection);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in receipt details", e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/day-expenses")
    public ResponseEntity<?> getDayExpenses(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String date) {
        try {
            List<ExpenseReportDTO> data = receiptPaymentReportService.getDayExpenses(schoolId, academicYear, date);
            double totalExpense = data.stream().mapToDouble(dto -> dto.getAmount() != null ? dto.getAmount() : 0.0).sum();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", data);
            response.put("totalExpense", totalExpense);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in day expenses", e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/period-expenses")
    public ResponseEntity<?> getPeriodExpenses(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            List<ExpenseReportDTO> data = receiptPaymentReportService.getPeriodExpenses(schoolId, academicYear, startDate, endDate);
            double totalExpense = data.stream().mapToDouble(dto -> dto.getAmount() != null ? dto.getAmount() : 0.0).sum();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", data);
            response.put("totalExpense", totalExpense);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in period expenses", e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}