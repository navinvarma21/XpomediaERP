package com.backend.school_erp.DTO.Store;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SupplierPaymentDTO {
    private String entryNo;
    private LocalDate paymentDate;

    private String supplierCode;
    private String supplierName;
    private String invoiceNo;

    private Double originalGrossAmount; // Gross Amount from Purchase
    private Double balanceAmount;

    // Payment Logic
    private Double settlementAmount;
    private Double discountPercent;
    private Double discountAmount;
    private Double netCashPaid;

    private String paymentMode;
    private String purchaseNarrative; // 👈 Stored in 'purchase_narrative' column
    private String paidNarrative;     // 👈 Stored in 'narrative' column

    private String schoolId;
    private String academicYear;
}