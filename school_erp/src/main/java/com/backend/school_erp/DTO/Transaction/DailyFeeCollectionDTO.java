package com.backend.school_erp.DTO.Transaction;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyFeeCollectionDTO {
    private String billNumber;
    private String admissionNumber;
    private String studentName;
    private String fatherName;
    private String standard;
    private String section;
    private String boardingPoint;
    private String emisNo;
    private String aadharNo;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime billDate;

    private Double previousBalance;
    private Double paidAmount;
    private Double concessionAmount;
    private Double netPaidAmount;
    private Double newBalance;
    private String paymentMode;
    private String paymentNumber;
    private String operatorName;
    private String transactionNarrative;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime transactionDate;

    private String routeNumber;
    private String schoolId;
    private String academicYear;
    private Long studentId;
    private List<FeePaymentDetailDTO> feePayments;
    private Double totalFeeAmount;
    private String status;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FeePaymentDetailDTO {
        private String id; // Added for unique identification
        private String feeHeading;
        private String description;
        private String accountHead;
        private String feeType;
        private Double feeAmount;
        private Double previousPaid;
        private Double previousConcession;
        private Double remainingBalance;
        private Double paidAmount;
        private Double concessionAmount;
        private String status;
    }
}