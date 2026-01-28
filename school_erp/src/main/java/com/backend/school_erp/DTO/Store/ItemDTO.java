package com.backend.school_erp.DTO.Store;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ItemDTO {
    private String itemCode;
    private String itemName;
    private String purchaseRate;
    private String group;
    private String unit;
    private String gstType;
    private String academicYear;
}