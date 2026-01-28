package com.backend.school_erp.DTO.ReceiptPaymentReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReceiptDetailsReportDTO {
    private String receiptNo;
    private String date;
    private String feeHead;
    private String accountHead;
    private String personName;
    private String description;
    private String receiptMode;
    private String referenceId;
    private Double amount;
}