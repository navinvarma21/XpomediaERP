package com.backend.school_erp.entity.Store;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccount {
    private Long id;
    private String bankName;
    private String accountName;
    private String accountNumber;
    private String ifscCode;
    private String branchName;
    private String accountType;
    private String schoolId;
    private String academicYear;
}