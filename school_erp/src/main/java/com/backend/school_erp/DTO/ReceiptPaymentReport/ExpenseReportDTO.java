package com.backend.school_erp.DTO.ReceiptPaymentReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ExpenseReportDTO {
    private String entryNo;
    private String date;
    private String mainHead;
    private String subHead;
    private String receiverName;
    private String description;
    private String paymentMode;
    private String referenceId; // Added field
    private Double amount;
}