package com.backend.school_erp.entity.Administration;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentHead {
    private Long id;
    private String name;
    private String schoolId;
    private String academicYear;
    private String createdAt;
}