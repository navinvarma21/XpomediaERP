package com.backend.school_erp.DTO.Store;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerStaffDTO {
    private String customerStaffCode;
    private String customerStaffName;
    private String numberStreetName;
    private String placePinCode;
    private String stateId;
    private String state;
    private String districtId;
    private String district;
    private String phoneNumber;
    private String email;
    private String contactPerson;
    private String schoolId;
    private String academicYear;
}