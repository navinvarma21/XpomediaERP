package com.backend.school_erp.DTO.Store;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDTO {
    private String supplierCode;
    private String supplierName;
    private String address;
    private String phoneNumber;
    private String email;
    private String contactPerson;
    private String gst;
    private String otherDetails;
    private String academicYear;
}