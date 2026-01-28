package com.backend.school_erp.entity.ReceiptPaymentReport;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptDetailsEntity {
    private Long id;
    private String receiptNo;
    private String date;
    private String feeHead;
    private String accountHead;
    private String personName;
    private String description;
    private String receiptMode;
    private String referenceId;
    private Double amount;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
}