package com.backend.school_erp.entity.Library;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibraryStock {
    private Long id;
    private String qrCodeNo;
    private String bookCode;
    private String bookName;
    private BigDecimal mrpRate;
    private BigDecimal purchaseRate;
    private BigDecimal sellingRate;
    private String departmentName;
    private Integer quantity; // Aggregated quantity (Total Stock)
    private String publisherName;
    private String authorName;
    private String language;
    private String supplierName;
    private String remarks;
    private String qrCodeImage; // Stores the Base64 QR Image
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}