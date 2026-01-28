package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentTCProfileDTO {
    private Map<String, Object> studentData;

    // Detailed Breakdown matching Balance List 4
    private Double academicFixed;
    private Double academicPaid;
    private Double academicBalance;

    private Double transportFixed;
    private Double transportPaid;
    private Double transportBalance;

    private Double totalFixed;
    private Double totalPaid; // Cash + Conc
    private Double totalPendingBalance; // Final Dues

    // NEW: List of specific heads that are pending
    private List<String> pendingFeeDetails;

    // NEW: Individual arrear fees for proper tracking
    private List<ArrearFeeDTO> individualArrears;

    // NEW: Aadhar number specifically extracted
    private String aadharNumber;

    // NEW: Community info for Tamil Nadu TC format
    private String community;
    private String suggestedCommunityOption; // "a", "b", "c", "d" or null

    // NEW: Block duplicate TC
    private boolean tcAlreadyGenerated;

    private boolean canIssueTC;
    private String academicYear;
}