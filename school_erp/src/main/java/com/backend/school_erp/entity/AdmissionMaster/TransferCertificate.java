package com.backend.school_erp.entity.AdmissionMaster;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferCertificate {
    private Long id;
    private String tcNumber;
    private String admissionNumber;
    private String studentName;
    private String standard;
    private String section;
    private String schoolId;
    private String academicYear;
    private String dateOfLeaving;
    private String reason;
    private String conduct;
    private Double feeBalanceShifted;
    private String tcDataJson; // Stores the full JSON for re-printing
    private LocalDateTime createdAt;
}