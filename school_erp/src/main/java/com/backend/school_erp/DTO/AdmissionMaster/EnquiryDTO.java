package com.backend.school_erp.DTO.AdmissionMaster;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EnquiryDTO {
    private String enquiryKey;
    private String admissionNumber;
    private String studentPhoto;
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
    private String academicYear;
    private String schoolId;

    // NEW: Store detailed fee structure with account heads
    private String feeStructure;

    @JsonIgnore
    private transient MultipartFile studentPhotoFile;

    // FIXED: Added field to track photo removal
    @JsonIgnore
    private boolean removeExistingPhoto;
}