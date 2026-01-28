package com.backend.school_erp.DTO.Administration;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffStudentDTO {
    private String recordCode;
    private String fullName;
    private String numberStreetName;
    private String placePinCode;
    private String stateId;
    private String state;
    private String districtId;
    private String district;
    private String phoneNumber;
    private String email;
    private String contactPerson;
    private String recordType;          // "STAFF" or "STUDENT"
    private String originalId;          // Staff Code or Admission Number
    private String schoolId;
    private String academicYear;
}