package com.backend.school_erp.DTO.Transaction;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentEntryDTO {
    private Integer entryNo;
    private String date;
    private String expenseName;        // paymentMainHead
    private String paymentSubHead;     // New field for account_head
    private String receiverName;
    private String description;
    private String paymentMode;
    private String referenceId;
    private Double amount;
    private String schoolId;
    private String academicYear;
}