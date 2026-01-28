package com.backend.school_erp.entity.Store;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialIssue {
    private Long id;
    private String billNo;
    private LocalDate issueDate;

    // Customer / Staff Details
    private String customerId; // ID from CustomerStaffMaster
    private String customerName;
    private String address;
    private String phoneNumber;

    // Payment Details
    private Double grossAmount;
    private Double discount;
    private Double netAmount;
    private Double paidAmount;
    private Double balanceAmount;
    private String paymentMode; // Cash / Credit

    private String schoolId;
    private String academicYear;
}