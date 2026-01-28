package com.backend.school_erp.DTO.Transaction;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class DailyFeeCollectionResponseDTO {
    private String billNumber;
    private String admissionNumber;
    private String studentName;
    private String fatherName;
    private String standard;
    private String section;
    private String boardingPoint;
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
    private LocalDateTime transactionDate;
    private String routeNumber;
    private List<FeeDetailDTO> feeDetails;

    @Data
    public static class FeeDetailDTO {
        private String type;
        private String feeHeading;
        private Double feeAmount;
        private Double paidAmount;
        private Double concessionAmount;
        private String description;
        private Boolean isConcession;
        private Double amount;
        private String accountHead;
        private String feeType;
    }
}