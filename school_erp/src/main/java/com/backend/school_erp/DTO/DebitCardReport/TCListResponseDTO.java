package com.backend.school_erp.DTO.DebitCardReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TCListResponseDTO {
    private String tcNumber;
    private String admissionNumber;
    private String studentName;
    private String standard;
    private String section;
    private String dateOfLeaving;
    private String issueDate;
    private String feeStatus;
    private Long id;
}