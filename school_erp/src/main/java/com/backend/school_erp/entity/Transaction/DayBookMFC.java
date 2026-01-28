package com.backend.school_erp.entity.Transaction;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DayBookMFC {
    private Long id;
    private String brNumber;
    private String admissionNumber;
    private String name;
    private LocalDateTime brDate;
    private String description;
    private String ledger;
    private Double credit;
    private Double debit;
    private String mode;
    private String operatorName;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
}