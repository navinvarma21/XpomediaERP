package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArrearFeeDTO {
    private String admissionNumber;
    private String studentName;
    private String standard;
    private Double amount;
    private String feeHead;
    private String inOut;
    private String academicYear;
    private String accountHead; // NEW: Added account_head field
}