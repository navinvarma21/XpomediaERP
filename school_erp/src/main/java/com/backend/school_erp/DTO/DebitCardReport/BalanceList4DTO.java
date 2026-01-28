package com.backend.school_erp.DTO.DebitCardReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceList4DTO {
    // Student Info
    private String admissionNumber;
    private String studentName;
    private String fatherName;
    private String grade;  // Standard + Section (Combined)

    // FIXED: Added Separate Standard and Section for easier filtering in Frontend
    private String standard;
    private String section;

    private String boardingPoint;

    // --- ACADEMIC ---
    private Double academicFixed;
    private Double academicPaid;    // Cash Only
    private Double academicBalance; // Fixed - (Paid + Conc)
    private String academicFixedDetails;
    private String academicPaidDetails;
    private String academicBalanceDetails; // Usually not detailed, but kept for consistency

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
    private String narrative; // Remarks

    private Double totalFixed;
    private Double actualPaid; // Total Cash
    private Double totalPaid;  // Cash + Concession (Gross)
    private Double totalBalance;
}