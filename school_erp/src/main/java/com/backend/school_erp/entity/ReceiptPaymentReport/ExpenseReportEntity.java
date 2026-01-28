package com.backend.school_erp.entity.ReceiptPaymentReport;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseReportEntity {
    private Long id;
    private String entryNo;
    private String date;
    private String mainHead;
    private String subHead;
    private String receiverName;
    private String description;
    private String paymentMode;
    private String referenceId; // Added field
    private Double amount;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
}