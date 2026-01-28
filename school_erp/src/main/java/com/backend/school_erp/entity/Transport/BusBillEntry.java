package com.backend.school_erp.entity.Transport;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusBillEntry {
    private Long id;
    private String busBillNumber;
    private String admissionNumber;
    private String studentName;
    private String fatherName;
    private String standard;
    private String section;
    private String boardingPoint;
    private LocalDateTime busBillDate;

    private Double originalBusAmount;
    private Double busPaidAmount;

    // UPDATED: Renamed to match new standard
    private Double remainingBalance;

    private String paymentMode;
    private String paymentNumber;
    private String operatorName;
    private String transactionNarrative;
    private LocalDateTime transactionDate;
    private String routeNumber;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String busFeePaymentsJson;
    private Double totalBusPaidAmount;
    private Double totalBusConcessionAmount;
    private Long studentId;
    private Double busFeeAmount;
}