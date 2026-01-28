package com.backend.school_erp.DTO.Collection;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusDayCollectionRequest {
    private LocalDate date;
    private String schoolId;
    private String academicYear;
}