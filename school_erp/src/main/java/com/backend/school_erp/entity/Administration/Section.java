package com.backend.school_erp.entity.Administration;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Section {
    private Long id;
    private String section;    // renamed from standard
    private String schoolId;
    private String academicYear;
}
