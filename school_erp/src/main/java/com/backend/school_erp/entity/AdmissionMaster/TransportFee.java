package com.backend.school_erp.entity.AdmissionMaster;

import lombok.Data;

@Data
public class TransportFee {
    private Long id;
    private Long admissionId;
    private String feeHeading;
    private String accountHead;
    private Double amount;
    private String boardingPoint;
    private String busRouteNumber;
    private String academicYear;
    private String schoolId;
}