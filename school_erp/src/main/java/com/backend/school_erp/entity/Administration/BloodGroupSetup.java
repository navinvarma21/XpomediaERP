package com.backend.school_erp.entity.Administration;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodGroupSetup {
    private Long id;
    private String bloodGroup;
    private String schoolId;
    private String academicYear;
}