package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.Data;

@Data
public class TransportFeeDTO {
    private String feeHeading;
    private String accountHead;
    private Double amount;
    private String boardingPoint;
    private String busRouteNumber;
}