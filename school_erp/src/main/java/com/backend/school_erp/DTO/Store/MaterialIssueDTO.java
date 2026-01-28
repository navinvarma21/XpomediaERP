package com.backend.school_erp.DTO.Store;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class MaterialIssueDTO {
    private String billNo;
    private LocalDate issueDate;

    // Customer Details
    private Long customerId;      // Database ID (Hidden)
    private String customerCode;  // 👈 ADDED THIS FIELD (e.g., CUST-001)
    private String customerName;
    private String address;
    private String phoneNumber;

    // Totals
    private Double grossAmount;
    private Double discount;
    private Double netAmount;
    private Double paidAmount;
    private Double balanceAmount;
    private String paymentMode;
    private String transactionRefNo; // For Cheque, DD, Online reference numbers

    // Bank Account Details for Bank Transfer
    private Map<String, Object> bankAccountDetails;

    private List<IssueItemEntry> items;

    @Data
    public static class IssueItemEntry {
        private String itemCode;
        private String itemName;
        private Integer quantity;
        private Double rate; // Sell Price
        private Double gstPercent;
        private Double total;
    }
}