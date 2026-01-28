package com.backend.school_erp.entity.Transaction;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffUpdate {
    private Long id;
    private String staffCode;
    private String name;
    private String familyHeadName;
    private String numberStreetName;
    private String placePinCode;
    private String stateId;
    private String state;
    private String districtId;
    private String district;
    private String gender;
    private String dateOfBirth;
    private String communityId;
    private String community;
    private String casteId;
    private String caste;
    private String religionId;
    private String religion;
    private String nationalityId;
    private String nationality;
    private String designationId;
    private String designation;
    private String educationQualification;
    private String salary;
    private String pfNumber;
    private String categoryId;
    private String category;
    private String maritalStatus;
    private String majorSubject;
    private String optionalSubject;
    private String extraTalentDlNo;
    private String experience;
    private String classInChargeId;
    private String classInCharge;
    private String dateOfJoining;
    private String emailBankAcId;
    private String totalLeaveDays;
    private String mobileNumber;
    private String status;
    private String dateOfRelieve;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
}