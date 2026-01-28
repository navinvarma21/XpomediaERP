package com.backend.school_erp.DTO.DebitCardReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrialBalanceResponseDTO {

    // The name of the Ledger (e.g., "By School Fee", "To Salary")
    private String ledgerName;

    // Total Credit Amount (Income/Receipt)
    private Double totalReceipt;

    // Total Debit Amount (Expense/Payment)
    private Double totalPayment;

    // Flag to highlight Opening/Closing balances in UI
    private Boolean isSystemRow;
}