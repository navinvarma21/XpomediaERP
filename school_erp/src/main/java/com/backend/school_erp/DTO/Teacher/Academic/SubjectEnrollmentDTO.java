package com.backend.school_erp.DTO.Teacher.Academic;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectEnrollmentDTO {
    private String schoolId;
    private String academicYear;
    private String term;
    private String standard;
    private String section; // Can be null or empty
    private List<String> subjects; // The list of subject names
}