package com.backend.school_erp.DTO.Administration;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MotherTongueSetupDTO {
    private Long id;
    private String motherTongue;
    private String schoolId;
    private String academicYear;
}