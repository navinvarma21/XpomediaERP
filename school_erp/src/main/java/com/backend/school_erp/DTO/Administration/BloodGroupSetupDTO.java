package com.backend.school_erp.DTO.Administration;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodGroupSetupDTO {
    private Long id;
    private String bloodGroup;
    private String schoolId;    // must match frontend payload
    private String academicYear;
}