package com.backend.school_erp.DTO.Collection;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeriodicalCollectionRequest {
    private String startDate;
    private String endDate;
    private String schoolId;
    private String academicYear;
}