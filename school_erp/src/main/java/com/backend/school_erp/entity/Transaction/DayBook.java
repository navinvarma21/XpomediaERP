package com.backend.school_erp.entity.Transaction;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DayBook {
    private Long id;
    private String brNumber;  // Changed from bill_number
    private String admissionNumber;
    private String name;
    private LocalDateTime brDate;  // Changed from bill_date
    private String description;
    private String ledger;  // NEW COLUMN: stores fee head
    private Double credit;
    private Double debit;
    private String mode;
    private String operatorName;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
}