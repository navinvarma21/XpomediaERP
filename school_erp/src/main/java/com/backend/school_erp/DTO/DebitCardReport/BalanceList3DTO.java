package com.backend.school_erp.DTO.DebitCardReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceList3DTO {
    private String standard;
    private String section;

    // --- ACADEMIC ---
    private Double academicFixed;
    private Double academicPaid;    // Cash Only
    private Double academicBalance; // Fixed - (Paid + Conc)
    private String academicFixedDetails;
    private String academicPaidDetails;
    private String academicBalanceDetails;

    // --- TRANSPORT ---
    private Double transportFixed;
    private Double transportPaid;   // Cash Only
    private Double transportBalance; // Fixed - (Paid + Conc)
    private String transportFixedDetails;
    private String transportPaidDetails;
    private String transportBalanceDetails;

    // --- SUMMARY ---
    private Double concession;
    private String concessionDetails;

    private Double totalFixed;
    private Double actualPaid; // Total Cash
    private Double totalPaid;  // Cash + Concession (Gross)
    private Double totalBalance;
}
