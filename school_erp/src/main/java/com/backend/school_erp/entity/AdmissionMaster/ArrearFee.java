package com.backend.school_erp.entity.AdmissionMaster;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArrearFee {
    private Long id;
    private String admissionNumber;
    private String studentName;
    private String standard;
    private Double amount;
    private String feeHead;
    private String inOut;
    private String schoolId;
    private String academicYear;
    private String accountHead; // NEW: Added account_head column
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}