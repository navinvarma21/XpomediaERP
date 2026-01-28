package com.backend.school_erp.DTO.Administration;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSetupDTO {
    private Long id;
    private String standard;
    private String schoolId;    // must match frontend payload
    private String academicYear;
}
