package com.backend.school_erp.entity.Transaction;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptEntry {
    private Long id;
    private String receiptNo;       // Changed from Integer to String to store In0001 format
    private String date;
    private String category;        // Main Head Name (stored as category)
    private String account_head;    // Sub Head Name (stored as account_head)
    private String personName;
    private String description;
    private String receiptMode;
    private String referenceId;
    private Double amount;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
    private String transactionId;
}