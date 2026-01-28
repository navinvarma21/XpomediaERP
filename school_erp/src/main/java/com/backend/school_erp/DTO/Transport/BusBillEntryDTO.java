package com.backend.school_erp.DTO.Transport;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusBillEntryDTO {
    private Long id;
    private String busBillNumber;
    private String admissionNumber;
    private String studentName;
    private String fatherName;
    private String standard;
    private String section;
    private String boardingPoint;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime busBillDate;

    private Double originalBusAmount;
    private Double totalBusPaidAmount;

    // UPDATED: Using remainingBalance
    private Double remainingBalance;

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
    private Double busFeeAmount;

    private List<Map<String, Object>> busFeePayments;
    private Double totalBusConcessionAmount;
}