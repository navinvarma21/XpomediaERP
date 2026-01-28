package com.backend.school_erp.DTO.DebitCardReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceList2DTO {
    // Student Info
    private String slNo;
    private String admissionNumber;
    private String studentName;
    private String fatherName;
    private String grade; // Standard + Section
    private String boardingPoint; // Point

    // Academic Fee (Fixed 25-26)
    private Double academicFixed;
    private Double academicPaid;
    private Double academicBalance;

    // Transport Fee
    private Double transportFixed;
    private Double transportPaid;
    private Double transportBalance;

    // Summary Columns
    private Double concession; // "Conc ess"
    private String narrative;  // "Narrat"

    private Double totalFixed; // Acad Fixed + Trans Fixed
    private Double actualPaid; // Acad Paid + Trans Paid (Cash)
    private Double totalPaid;  // Actual Paid + Concession (Gross)
    private Double totalBalance; // Total Fixed - Total Paid
}