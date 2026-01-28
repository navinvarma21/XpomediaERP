package com.backend.school_erp.entity.Transaction;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DFCConcession {
    private String billNumber;
    private String admissionNumber;
    private Double concessionAmount;
    private String schoolId;
    private String studentName;
    private String fatherName;
    private String standard;
    private String section;
    private String aadharNo;
    private String academicYear;
    private LocalDateTime createdAt;
}