package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TCRequestDTO {
    private String admissionNumber;
    private String studentName;
    private String standard;
    private String section;
    private String reasonForLeaving;
    private String conduct;
    private String dateOfLeaving; // Changed to String to prevent deserialization error (e.g. 18/01/2026 vs 2026-01-18)
    private String tcNumber; // Serial No
    private String promotionStatus;
    private String schoolId;
    private String academicYear;

    // Detailed Fields for the Certificate Storage
    private String emisNo;
    private String aadharNo;
    private String nationality;
    private String religion;
    private String community;
    private String caste;
    private String dateOfBirth;
    private String dateOfAdmission;
    private String motherTongue;
    private String mediumOfInstruction;
    private String identificationMark1;
    private String identificationMark2;
    private String scholarshipDetails;
    private String medicalInspection;
    private String applicationDate;
    private String issueDate;

    // Course Study Details
    private String courseAcademicYears;
    private String courseStandardStudied;
    private String courseFirstLanguage;
    private String courseMedium;

    // NEW: Community selection for Tamil Nadu TC format
    private String communityOption; // "a", "b", "c", "d"

    // NEW: Pending fees as individual arrears
    private List<ArrearFeeDTO> pendingFees;

    // NEW: Block duplicate TC generation
    private boolean tcAlreadyExists;
}