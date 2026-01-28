package com.backend.school_erp.entity.Teacher.Academic;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Section {
    private Long id;
    private String section; // Mapped to column 'section'
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
}