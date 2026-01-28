package com.backend.school_erp.DTO.Teacher.Academic;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TermDTO {
    private Long id;
    private String name;
    private LocalDate start;
    private LocalDate end;
    private String status;
    private String academicYear;
}