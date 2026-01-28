package com.backend.school_erp.DTO.Collection;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectionReportResponse {
    private List<CollectionReportDTO> collections;
    private Double totalCollection;
    private Double totalConcession;
    private String schoolName;
    private String reportPeriod;
    private Integer recordCount;
    private String startDate;
    private String endDate;
}