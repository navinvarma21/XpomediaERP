package com.backend.school_erp.entity.Transaction;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MiscellaneousFeeCollection {
    private Long id;
    private String billNumber;
    private String admissionNumber;
    private String studentName;
    private String fatherName;
    private String standard;
    private String section;
    private String emisNo;
    private String aadharNo;
    private String boardingPoint;
    private LocalDateTime billDate;
    private String feeHead;
    private String accountHead;
    private Double paidAmount;
    private Double concessionAmount;
    private Double netPaidAmount;
    private String paymentMode;
    private String paymentNumber;
    private String operatorName;
    private String transactionNarrative;
    private LocalDateTime transactionDate;
    private String routeNumber;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
}