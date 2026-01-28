package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeeDetailDTO {
    private Long id;
    private String standardId;
    private String standard;
    private String studentCategoryId;
    private String studentCategory;
    private String feeHeadingId;
    private String feeHeading;
    private String accountHead; // Added Account Head
    private BigDecimal amount;
    private String feeAmount; // For backward compatibility
    private String schoolId;
    private String academicYear;
    private String type; // "TUITION", "HOSTEL", or "BUS"
}