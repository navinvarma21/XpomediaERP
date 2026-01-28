package com.backend.school_erp.entity.AdmissionMaster;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Enquiry {
    private Long id;
    private String enquiryKey;
    private String admissionNumber;
    private byte[] studentPhoto;
    private String studentPhotoContentType;
    private String studentName;
    private String fatherName;
    private String motherName;
    private String streetVillage;
    private String placePincode;
    private String district;
    private String phoneNumber;
    private String boardingPoint;
    private String busRouteNumber;
    private String emailId;
    private String communicationAddress;
    private String nationality;
    private String religion;
    private String state;
    private String community;
    private String caste;
    private String studentType;
    private String studentCategory;
    private String standard;
    private String section;
    private String gender;
    private String dateOfBirth;
    private String emis;
    private String lunchRefresh;
    private String bloodGroup;
    private String dateOfAdmission;
    private String motherTongue;
    private String fatherOccupation;
    private String motherOccupation;
    private String examNumber;
    private String busFee;
    private String hostelFee;
    private String tutionFees;
    private String studiedYear;
    private String classLastStudied;
    private String classToBeAdmitted;
    private String nameOfSchool;
    private String remarks;
    private String identificationMark1;
    private String identificationMark2;
    private String aadharNumber;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // NEW: Store detailed fee structure as JSON
    private String feeStructureJson;
}