package com.backend.school_erp.entity.Library;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LinkedQRHistory {
    private Long id;
    private String oldQrCodeNo;
    private String oldBookCode;
    private Integer oldQuantity;

    private String newQrCodeNo;
    private String newBookCode;
    private String newQrCodeImage;

    private String bookName;
    private BigDecimal mrpRate;
    private BigDecimal purchaseRate;
    private BigDecimal sellingRate;
    private BigDecimal labelAmount;
    private String departmentName;
    private Integer quantityAdded; // New quantity added

    private String supplierCode;
    private String supplierName;
    private String remarks;

    private String schoolId;
    private String academicYear;
    private LocalDateTime purchaseDate;
}