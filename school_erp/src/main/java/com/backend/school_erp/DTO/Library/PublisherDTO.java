package com.backend.school_erp.DTO.Library;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublisherDTO {
    private Long id;
    private String name;
    private String schoolId;
    private String academicYear;
}