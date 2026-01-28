package com.backend.school_erp.entity.Store;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TabPurchase {
    private Long id;
    private String entryNo;       // Auto Generated
    private String supplierCode;
    private String supplierName;
    private String tin;           // Fixed as "Purchase"
    private String invoiceNo;     // Manual Input
    private LocalDate invoiceDate;
    private LocalDate purchaseDate;
    private Double grossAmount;   // Total with GST
    private Double credit;        // Same as Gross Amount
    private Double debit;         // 0.0
    private String narrative;
    private String paymentMode;
    private Double gstAmount;
    private Double others;        // Amount without GST (Taxable)
    private String schoolId;
    private String academicYear;
}