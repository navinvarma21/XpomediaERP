package com.backend.school_erp.DTO.DebitCardReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerReportDTO {
    private Long id;
    private String brNumber;        // Bill/V.No.
    private String admissionNumber; // Part of Particulars-3
    private String name;            // Part of Particulars-2
    private LocalDateTime date;
    private String description;     // Part of Particulars-3
    private String ledger;          // Particulars-1 (Fee Head or Bank Name)
    private Double credit;          // Income
    private Double debit;           // Expense / Bank Contra
    private String mode;            // Bank, Cash, Online, etc. OR "HEADER", "SYSTEM"
    private String operatorName;    // Part of Particulars-2

    // Helper for sorting
    public boolean isCash() {
        return "cash".equalsIgnoreCase(mode);
    }
}