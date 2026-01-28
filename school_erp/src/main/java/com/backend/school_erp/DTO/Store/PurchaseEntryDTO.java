package com.backend.school_erp.DTO.Store;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PurchaseEntryDTO {
    private String entryNo;
    private String supplierCode;
    private String supplierName;
    private String invoiceNo;
    private LocalDate invoiceDate;
    private LocalDate purchaseDate;

    // Amounts
    private Double purchaseAmount; // Base Amount input
    private Double gstPercent;
    private Double discountPercent;

    // Calculated in Backend or Frontend
    private Double gstAmount;
    private Double taxableAmount; // "Others"
    private Double netAmount;     // "Gross/Credit"

    private String narrative;
    private String paymentMode;
}