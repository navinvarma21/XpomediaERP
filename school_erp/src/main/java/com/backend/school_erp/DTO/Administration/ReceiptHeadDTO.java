package com.backend.school_erp.DTO.Administration;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptHeadDTO {
    private String headName;
    private String academicYear;
}