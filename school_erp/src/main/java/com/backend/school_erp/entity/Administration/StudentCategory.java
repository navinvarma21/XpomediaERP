package com.backend.school_erp.entity.Administration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentCategory {
    private Long id;
    private String studentCategoryName;
    private String schoolId;
    private String academicYear;
    private Timestamp createdAt;
}
