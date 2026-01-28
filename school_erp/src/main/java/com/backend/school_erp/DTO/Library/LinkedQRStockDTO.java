package com.backend.school_erp.DTO.Library;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LinkedQRStockDTO {
    // Old QR Info
    private String oldQrCodeNo;
    private String oldBookCode;

    // New QR Info
    private String newQrCodeNo;
    private String newBookCode;
    private String newQrCodeImage;

    // Book Info (common)
    private String bookName;
    private BigDecimal mrpRate;
    private BigDecimal purchaseRate;
    private BigDecimal sellingRate;
    private BigDecimal labelAmount;
    private String departmentName;
    private Integer quantity; // New quantity to add
    private String publisherName;
    private String authorName;
    private String language;

    // Supplier Info
    private String supplierCode;
    private String supplierName;
    private String remarks;

    // System Info
    private String schoolId;
    private String academicYear;
}