package com.backend.school_erp.DTO.Collection;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MOPeriodicalCollectionRequest {
    private String schoolId;
    private String academicYear;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String reportType;
}