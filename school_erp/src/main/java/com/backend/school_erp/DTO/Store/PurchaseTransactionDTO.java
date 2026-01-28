package com.backend.school_erp.DTO.Store;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseTransactionDTO {
    // Header Details
    private String billNumber;
    private String entryNumber;
    private LocalDate entryDate;
    private String supplierCode;
    private String supplierName;
    private String month;
    private Double grossAmount;

    // List of Items
    private List<PurchaseItemDTO> items;
    private String schoolId;
    private String academicYear;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseItemDTO {
        private String itemCode;
        private String description;
        private String head;
        private String standard;
        private String unit;
        private Integer quantity;
        private Double rate;
        private Double gstPercent;
        private Double total;
    }
}