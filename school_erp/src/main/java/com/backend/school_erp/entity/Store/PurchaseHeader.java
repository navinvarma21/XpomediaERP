package com.backend.school_erp.entity.Store;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseHeader {
    private Long id;
    private String billNumber;      // Manual Inv/Bill No
    private String entryNumber;     // Auto-generated Bill00...
    private LocalDate entryDate;
    private String supplierCode;
    private String supplierName;
    private String month;           // e.g., "December"
    private Double totalAmount;     // Gross Amount
    private String schoolId;
    private String academicYear;
}