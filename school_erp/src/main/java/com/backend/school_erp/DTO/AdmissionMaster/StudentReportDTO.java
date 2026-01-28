package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.Data;
import java.time.LocalDate;

@Data
public class StudentReportDTO {
    private Long id;
    private String admissionNumber;
    private LocalDate dateOfAdmission;
    private String studentName;
    private String gender;
    private String fatherName;
    private String motherName;
    private String phoneNumber;
    private String standard;
    private String section;
    private String streetVillage;
    private String placePincode;
    private String district;
    private String state;
    private String emailId;
    private String busRouteNumber;
    private LocalDate dateOfBirth;
    private String emisNumber;
    private String aadharNumber;
    private String schoolId;
    private String academicYear;
}