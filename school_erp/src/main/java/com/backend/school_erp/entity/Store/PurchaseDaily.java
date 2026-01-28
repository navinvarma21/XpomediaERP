package com.backend.school_erp.entity.Store;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseDaily {
    private Long id;
    private String billNumber;      // Invoice No (Manual)
    private LocalDate entryDate;    // 👈 NEW: Added Date
    private String month;           // 👈 NEW: Added Month
    private String supplierCode;
    private String itemCode;
    private String description;
    private String head;
    private String standard;
    private String unit;
    private Integer quantity;
    private Double rate;
    private Double gstPercent;
    private Double lineTotal;
    private String schoolId;
    private String academicYear;
}