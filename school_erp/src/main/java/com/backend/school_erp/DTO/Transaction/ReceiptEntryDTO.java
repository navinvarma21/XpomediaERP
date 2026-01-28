package com.backend.school_erp.DTO.Transaction;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptEntryDTO {
    private String receiptNo;        // Changed from Integer to String to store In0001 format
    private String date;            // Format: yyyy-MM-dd
    private String category;        // Main Head Name (goes to category in receipt_entries)
    private String account_head;    // Sub Head Name (goes to account_head in receipt_entries)
    private String personName;      // Person name (goes to name in day_book)
    private String description;     // Description
    private String receiptMode;     // cash/bank/online
    private String referenceId;     // For bank/online payments
    private Double amount;          // Amount (goes to credit in day_book)
    private String schoolId;        // Required
    private String academicYear;    // Required
}