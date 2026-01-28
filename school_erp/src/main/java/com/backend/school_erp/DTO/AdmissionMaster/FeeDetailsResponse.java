package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.Data;
import java.util.List;

@Data
public class FeeDetailsResponse {
    private List<TuitionFeeDTO> tuitionFees;
    private List<HostelFeeDTO> hostelFees;
    private TransportFeeDTO transportFee;
    private Double totalTuitionFee;
    private Double totalHostelFee;
    private Double totalTransportFee;
    private Double grandTotal;
}