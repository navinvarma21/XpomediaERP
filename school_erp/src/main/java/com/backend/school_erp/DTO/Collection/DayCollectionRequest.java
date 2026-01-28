package com.backend.school_erp.DTO.Collection;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DayCollectionRequest {
    private String date;
    private String schoolId;
    private String academicYear;
}