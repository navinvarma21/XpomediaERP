package com.backend.school_erp.DTO.Administration;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptSubHeadDTO {
    private String mainHeadName; // Changed from mainHeadId to mainHeadName
    private String subHeadName;
    private String academicYear;
}