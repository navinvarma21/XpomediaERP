package com.backend.school_erp.entity.Administration;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffStudent {
    private Long id;
    private String recordCode;          // SS-1, SS2-STAFF-STF101, SS3-STU-ADM001
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}