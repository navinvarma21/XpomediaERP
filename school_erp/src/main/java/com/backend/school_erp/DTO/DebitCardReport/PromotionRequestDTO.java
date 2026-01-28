package com.backend.school_erp.DTO.DebitCardReport;

import lombok.Data;
import java.util.List;

@Data
public class PromotionRequestDTO {
    private String schoolId;
    private String sourceAcademicYear;
    private String targetAcademicYear;
    private String targetStandard;
    private String targetSection;
    private List<String> studentAdmissionNumbers;
}