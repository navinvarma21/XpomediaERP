package com.backend.school_erp.entity.AdmissionMaster;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndividualFee {
    private Long id;
    private String admissionNumber;
    private String studentName;
    private String feeHead;
    private String accountHead; // Added
    private Double amount;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}