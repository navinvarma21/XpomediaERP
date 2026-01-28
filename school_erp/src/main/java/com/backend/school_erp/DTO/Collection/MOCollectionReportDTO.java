package com.backend.school_erp.DTO.Collection;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MOCollectionReportDTO {
    private String billNumber;
    private String admissionNumber;
    private String studentName;
    private String standard;
    private String section;
    private LocalDateTime timestamp; // Maps to billDate
    private Double totalPaidAmount;
    private Double totalConcessionAmount;
    private List<Map<String, Object>> feeDetails; // List of objects { "feeHead": "Tuition" }
    private String description; // Comma separated string
    private String feeType;
    private String paymentMode;
    private String paymentNumber;
    private LocalDateTime createdDate;
}