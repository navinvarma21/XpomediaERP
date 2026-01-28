package com.backend.school_erp.entity.Store;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Item {
    private Long id;
    private String itemCode;
    private String itemName;
    private String purchaseRate;
    private String group;
    private String unit;
    private String gstType;
    private String schoolId;
    private String academicYear;
}