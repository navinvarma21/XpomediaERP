package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import java.util.List;

@Data
public class AdmissionDTO {
    private String enquiryKey;
    private String admissionNumber;
    private MultipartFile studentPhotoFile;
    private boolean removeExistingPhoto;
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

    // Fee details (will be stored in separate tables)
    private List<TuitionFeeDTO> tuitionFees;
    private List<HostelFeeDTO> hostelFees;
    private TransportFeeDTO transportFee;

    private Double totalTuitionFee;
    private Double totalHostelFee;
    private Double totalTransportFee;
    private Double totalFees;

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
}