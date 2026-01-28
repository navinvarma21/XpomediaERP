package com.backend.school_erp.entity.Store;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Stock {
    private Long id;
    private String itemCode;
    private String itemName;
    private Integer totalQuantity;
    private Double purchaseRate;
    private String head;
    private String unit;            // 👈 NEW: Added Unit
    private Double gstPercent;
    private String standard;
    private String schoolId;
}