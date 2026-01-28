package com.backend.school_erp.entity.Store;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerStaff {
    private Long id;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}