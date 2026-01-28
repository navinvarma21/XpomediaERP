package com.backend.school_erp.DTO.DebitCardReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceListDTO {
    private String standard;
    private String section;

    // Academic Fees (Tuition, Term, etc.)
    private Double academicFixed;
    private Double academicPaid;
    private Double academicBalance;

    // Transport / Other Fees
    private Double transportFixed;
    private Double transportPaid;
    private Double transportBalance;

    // Summary
    private Double concession; // Negative value usually
    private Double totalFixed; // Grand Demand
    private Double actualPaid; // Cash Received
    private Double totalPaid;  // Cash + Concession (Gross)
    private Double totalBalance;
}