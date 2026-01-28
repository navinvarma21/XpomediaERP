package com.backend.school_erp.entity.Administration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostelFeeSetup {
    private Long id;
    // IDs removed as per requirement
    private String standard;
    private String studentCategory;
    private String feeHeading;
    private String accountHead; // Added accountHead
    private BigDecimal feeAmount;
    private String schoolId;
    private String academicYear;
    private Timestamp createdAt;
}