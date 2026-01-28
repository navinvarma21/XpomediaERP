package com.backend.school_erp.entity.AdmissionMaster;

import lombok.Data;

@Data
public class HostelFee {
    private Long id;
    private Long admissionId;
    private String feeHeading;
    private String accountHead;
    private Double amount;
    private String academicYear;
    private String schoolId;
}