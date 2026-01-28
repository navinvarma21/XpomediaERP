package com.backend.school_erp.entity.Store;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Supplier {
    private Long id;
    private String supplierCode;
    private String supplierName;
    private String address;
    private String phoneNumber;
    private String email;
    private String contactPerson;
    private String gst;
    private String otherDetails;
    private String schoolId;
    private String academicYear;
}