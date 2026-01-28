package com.backend.school_erp.entity.Teacher.Academic;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicYear {
    private Long yearId;
    private String year;
    private LocalDateTime createdAt;
    private List<Term> terms;
}