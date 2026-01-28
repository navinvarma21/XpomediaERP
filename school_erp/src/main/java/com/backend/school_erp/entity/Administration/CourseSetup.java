package com.backend.school_erp.entity.Administration;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSetup {
    private Long id;
    private String standard;
    private String schoolId;
    private String academicYear;
}
