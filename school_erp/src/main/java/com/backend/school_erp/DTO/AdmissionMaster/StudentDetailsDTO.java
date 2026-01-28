package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.Data;
import java.time.LocalDate;

@Data
public class StudentDetailsDTO {
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
    private String emis;
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
    private String aadharNumber;
    private String schoolId;
    private String academicYear;
    private String remarks;
    private String identificationMark1;
    private String identificationMark2;

    // For fee integration
    private Double totalFees;
    private Double totalPaid;
    private Double totalConcession;
    private Double balance;
}