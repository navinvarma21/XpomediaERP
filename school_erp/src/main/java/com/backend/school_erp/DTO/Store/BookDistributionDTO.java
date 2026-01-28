package com.backend.school_erp.DTO.Store;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class BookDistributionDTO {
    private String admissionNo;
    private String studentName;
    private String standard;
    private String section;
    private LocalDate feeDate;
    private String paymode;
    private String ddcheckNo;
    private double concessionAmount;
    private String operatorNo;
    private List<ItemEntry> items;

    // New field for bank account details
    private Map<String, Object> bankAccountDetails;

    @Data
    public static class ItemEntry {
        private String descriptionName; // Item Name
        private int quantity;
        private double amount; // Rate per unit
    }
}