package com.backend.school_erp.entity.Administration;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptSubHead {
    private Long id;
    private String mainHeadName; // Changed from mainHeadId to mainHeadName
    private String subHeadName;
    private String schoolId;
    private String academicYear;
    private String createdAt;
}