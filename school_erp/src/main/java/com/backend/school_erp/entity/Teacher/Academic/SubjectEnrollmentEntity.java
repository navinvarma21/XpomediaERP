package com.backend.school_erp.entity.Teacher.Academic;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectEnrollmentEntity {
    private Long id;
    private String schoolId;
    private String academicYear;
    private String term;
    private String standard;
    private String section;
    private String subjectName; // Single subject per row
}