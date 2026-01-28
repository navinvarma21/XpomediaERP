package com.backend.school_erp.entity.Library;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemPurchase {
    private Long id;
    private String purchaseId;
    private String qrCodeNo;
    private String oldQrCodeNo; // ADD THIS FIELD
    private String bookCode;
    private String bookName;
    private BigDecimal mrpRate;
    private BigDecimal purchaseRate;
    private BigDecimal sellingRate;
    private BigDecimal labelAmount; // ADD THIS FIELD
    private String departmentName;
    private Integer quantity;
    private String publisherName;
    private String authorName;
    private String language;
    private String supplierName;
    private String remarks;
    private BigDecimal totalAmount;
    private String qrCodeImage;
    private String schoolId;
    private String academicYear;
    private LocalDateTime purchaseDate;
}