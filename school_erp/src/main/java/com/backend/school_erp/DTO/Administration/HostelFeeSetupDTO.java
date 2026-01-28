package com.backend.school_erp.DTO.Administration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostelFeeSetupDTO {
    // IDs removed from DTO as they are not stored/needed
    private String standard;
    private String studentCategory;
    private String feeHeading;
    private String accountHead; // Added accountHead
    private BigDecimal feeAmount;
    private String academicYear;
}