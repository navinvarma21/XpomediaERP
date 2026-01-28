package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndividualFeeDTO {
    private String admissionNumber;
    private String studentName;
    // studentId removed
    private String feeHead;
    private String accountHead; // Added
    private Double amount;
    private String schoolId;
    private String academicYear;
}