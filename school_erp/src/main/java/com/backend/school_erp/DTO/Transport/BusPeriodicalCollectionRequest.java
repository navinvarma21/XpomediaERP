package com.backend.school_erp.DTO.Collection;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusPeriodicalCollectionRequest {
    private LocalDate startDate;
    private LocalDate endDate;
    private String schoolId;
    private String academicYear;
}