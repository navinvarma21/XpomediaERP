package com.backend.school_erp.DTO.Collection;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectionReportDTO {
    private String billNumber;
    private String admissionNumber;
    private String studentName;
    private String fatherName;
    private String standard;
    private String section;
    private String boardingPoint;
    private LocalDateTime billDate;
    private LocalDateTime transactionDate;

    // Amounts from daily_fee_collection
    private Double paidAmount;           // Cash paid
    private Double concessionAmount;     // Concession given
    private Double netPaidAmount;        // Gross cleared (paid + concession)

    // Additional fields
    private List<Map<String, Object>> feeDetails;
    private String description;
    private String paymentMode;
    private String paymentNumber;
    private String operatorName;
    private String transactionNarrative;
    private String feeHead;              // Individual fee head
    private String accountHead;

    // For summary calculations
    private Double totalPaidAmount;      // For backward compatibility
    private Double totalConcessionAmount; // For backward compatibility
}