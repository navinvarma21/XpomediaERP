package com.backend.school_erp.entity.Transaction;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentEntry {
    private Long id;
    private Integer entryNo;
    private String date;
    private String expenseName;        // paymentMainHead
    private String accountHead;        // paymentSubHead stored as account_head in DB
    private String receiverName;
    private String description;
    private String paymentMode;
    private String referenceId;
    private Double amount;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
    private String transactionId;
}