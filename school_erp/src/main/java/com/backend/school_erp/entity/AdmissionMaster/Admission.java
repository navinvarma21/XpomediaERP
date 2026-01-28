package com.backend.school_erp.entity.AdmissionMaster;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class Admission {
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
    private String phoneNumber;      // Primary phone number
    private String phoneNumber2;     // Secondary phone number
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
    private Double totalTuitionFee;  // Total from tuition_fees table
    private Double totalHostelFee;   // Total from hostel_fees table
    private Double totalTransportFee; // Total from transport_fees table
    private Double totalFees;        // Grand total
    private String studiedYear;
    private String classLastStudied;
    private String classToBeAdmitted;
    private String nameOfSchool;
    private String remarks;
    private String identificationMark1;
    private String identificationMark2;
    private String aadharNumber;
    private String qrCodeData;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}