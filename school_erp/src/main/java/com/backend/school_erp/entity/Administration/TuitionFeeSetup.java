package com.backend.school_erp.entity.Administration;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TuitionFeeSetup {
    private Long id;
    private String standard; // Remove standardId
    private String studentCategory; // Remove studentCategoryId
    private String feeHeading; // Remove feeHeadingId
    private String accountHead; // Add this field
    private BigDecimal feeAmount;
    private String schoolId;
    private String academicYear;
    private Timestamp createdAt;
}