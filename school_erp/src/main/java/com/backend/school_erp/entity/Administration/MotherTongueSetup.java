package com.backend.school_erp.entity.Administration;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MotherTongueSetup {
    private Long id;
    private String motherTongue;
    private String schoolId;
    private String academicYear;
}