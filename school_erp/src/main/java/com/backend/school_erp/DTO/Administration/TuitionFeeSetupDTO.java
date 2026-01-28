package com.backend.school_erp.DTO.Administration;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TuitionFeeSetupDTO {
    private String standard;
    private String studentCategory;
    private String feeHeading;
    private String accountHead; // Add this field
    private BigDecimal feeAmount;
    private String academicYear;
}
