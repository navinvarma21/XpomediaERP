package com.backend.school_erp.DTO.Library;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookSupplierDTO {
    private String supplierCode;
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
    private String academicYear;
}