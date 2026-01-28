package com.backend.school_erp.DTO.Library;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookQRCodeDTO {
    private String qrCodeNo;
    private String bookCode;
    private String bookName;
    private BigDecimal mrpRate;
    private BigDecimal purchaseRate;
    private BigDecimal sellingRate;
    private String departmentName;
    private Integer quantity;
    private String publisherName;
    private String authorName;
    private String language;
    private String supplierName;
    private String remarks;
    private String qrCodeImage; // Base64 encoded image string
    private String schoolId;
    private String academicYear;
}