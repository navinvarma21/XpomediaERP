package com.backend.school_erp.DTO.Collection;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MOCollectionReportResponse {
    private boolean success;
    private String message;
    private List<MOCollectionReportDTO> data;
    private Map<String, Object> summary;
    private String reportType;
    private String academicYear;
    private String period;
}