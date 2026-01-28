package com.backend.school_erp.DTO.Administration;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSubHeadDTO {
    private String paymentMainHead;
    private String paymentSubHead;
    private String academicYear;
}