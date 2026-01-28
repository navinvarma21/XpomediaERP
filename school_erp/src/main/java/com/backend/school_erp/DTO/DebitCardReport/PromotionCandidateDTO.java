package com.backend.school_erp.DTO.DebitCardReport;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PromotionCandidateDTO {
    private String admissionNumber;
    private String studentName;
    private String status;
    private Double pendingAmount;
    private boolean promoted; // New field to track promotion status
}