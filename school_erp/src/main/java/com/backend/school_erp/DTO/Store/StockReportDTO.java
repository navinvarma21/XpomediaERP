package com.backend.school_erp.DTO.Store;

import lombok.Data;

@Data
public class StockReportDTO {
    private String description;
    private String unit;
    private Long purchaseQty;
    private String category;
    private String standard;
    private Long issuedQty;
    private Long balanceQty;
    private Long openingBalance;
    private Long closingBalance;
    private Double totalValue; // Optional: for future extension
}