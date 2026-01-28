package com.backend.school_erp.entity.AdmissionMaster;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class StudentDetails {
    private Long id;
    private String enquiryKey;
    private String admissionNumber;
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
    private LocalDate dateOfBirth;

    // Critical fields for Billing
    private String emis;
    private String aadharNumber;

    private String lunchRefresh;
    private String bloodGroup;
    private LocalDate dateOfAdmission;
    private String motherTongue;
    private String fatherOccupation;
    private String motherOccupation;
    private String examNumber;
    private String studiedYear;
    private String classLastStudied;
    private String classToBeAdmitted;
    private String nameOfSchool;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String remarks;
    private String identificationMark1;
    private String identificationMark2;

    // Transient fields for Fee Calculation (Optional, populated by Service if needed)
    private Double tuitionFee;
    private Double hostelFee;
    private Double transportFee;
}