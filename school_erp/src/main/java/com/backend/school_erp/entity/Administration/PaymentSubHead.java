package com.backend.school_erp.entity.Administration;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSubHead {
    private Long id;
    private String paymentMainHead;
    private String paymentSubHead;
    private String schoolId;
    private String academicYear;
    private String createdAt;
}