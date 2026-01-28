package com.backend.school_erp.DTO.Teacher.Academic;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicYearDTO {
    private String academicYear;
    private List<TermDTO> terms;
}