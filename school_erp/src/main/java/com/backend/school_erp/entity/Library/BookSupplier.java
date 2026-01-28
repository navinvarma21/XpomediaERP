package com.backend.school_erp.entity.Library;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookSupplier {
    private Long id;
    private String supplierCode;          // BKS-1, BKS-2
    private String supplierName;
    private String address;
    private String phoneNumber;
    private String email;
    private String contactPerson;
    private String gstNumber;
    private String bookCategories;        // Textbooks, Novels, Reference, etc.
    private String paymentTerms;          // 30 days, 60 days, etc.
    private String deliveryTerms;         // FOB, COD, etc.
    private String remarks;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}