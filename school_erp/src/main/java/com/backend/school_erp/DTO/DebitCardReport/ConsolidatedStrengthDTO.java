package com.backend.school_erp.DTO.DebitCardReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsolidatedStrengthDTO {
    private String grade;       // Standard (e.g., LKG, I, X)
    private String section;     // Section (e.g., A, B)
    private long oldNos;        // Existing Students
    private long newNos;        // New Admissions
    private long leftWithTc;    // Left With TC
    private long leftWithoutTc; // Left Without TC (Dropouts)
    private long total;         // Current Total Strength
}