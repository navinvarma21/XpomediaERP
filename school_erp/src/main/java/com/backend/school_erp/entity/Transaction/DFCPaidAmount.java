package com.backend.school_erp.entity.Transaction;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DFCPaidAmount {
    private String billNumber;
    private String admissionNumber;
    private Double amount;
    private String studentName;
    private String fatherName;
    private String standard;
    private String section;
    private String schoolId;
    private String aadharNo;
    private String academicYear;
    private LocalDateTime createdAt;
}