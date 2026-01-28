package com.backend.school_erp.DTO.Administration;

import lombok.*;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionDTO {
    @NotBlank(message = "Section is required")
    private String section;    // renamed from standard

    @NotBlank(message = "Academic Year is required")
    private String academicYear;
}
