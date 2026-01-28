package com.backend.school_erp.entity.Administration;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptHead {
    private Long id;
    private String headName;
    private String schoolId;
    private String academicYear;
    private String createdAt;
}