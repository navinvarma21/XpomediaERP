package com.backend.school_erp.entity.Store;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpPayment {
    private Long id;
    private LocalDate billDate;
    private String supplierCode;
    private String supplierName;
    private String billNumber;
    private Double paymentAmount;
    private Double balanceAmount;
    private Double amountPaid;
    private String status;
    private String invoiceNumber;
    private String schoolId;
    private String academicYear;
}