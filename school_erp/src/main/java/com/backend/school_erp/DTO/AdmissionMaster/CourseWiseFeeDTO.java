package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseWiseFeeDTO {
    private String course;
    private String sex;
    private String feeHead;
    private String accountHead; // Added
    private Double amount;
    private String schoolId;
    private String academicYear;
}