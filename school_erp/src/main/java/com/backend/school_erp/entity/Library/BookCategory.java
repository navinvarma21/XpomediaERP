package com.backend.school_erp.entity.Library;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookCategory {
    private Long id;
    private String name;
    private String schoolId;
    private String academicYear;
}