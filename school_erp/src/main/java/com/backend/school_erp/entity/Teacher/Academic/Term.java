package com.backend.school_erp.entity.Teacher.Academic;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Term {
    private Long id;
    private String name;
    private LocalDate start;
    private LocalDate end;
    private String status; // 'active' or 'inactive'
    private String academicYear;
    private LocalDateTime createdAt;
    private boolean isCurrentActive; // Helper for UI
}