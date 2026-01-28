package com.backend.school_erp.DTO.Store;

import lombok.Data;

@Data
public class BankAccountDTO {
    private String bankName;
    private String accountName;
    private String accountNumber;
    private String ifscCode;
    private String branchName;
    private String accountType;
    private String schoolId;
    private String academicYear;
}