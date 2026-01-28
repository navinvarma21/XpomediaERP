package com.backend.school_erp.DTO.Teacher.Academic;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActiveSessionDTO {
    private String activeYear;
    private Long activeTermId;
    private String activeTermName;
    private Long activeSectionId;
    private String activeSectionName;
}