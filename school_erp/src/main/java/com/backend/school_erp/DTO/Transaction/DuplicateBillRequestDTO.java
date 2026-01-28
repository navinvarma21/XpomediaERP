package com.backend.school_erp.DTO.Transaction;

import lombok.Data;

@Data
public class DuplicateBillRequestDTO {
    private String schoolId;
    private String academicYear;
    private String billNumber;
    private String billType; // "DailyFeeCollection" or "MiscellaneousFee"

    public String validate() {
        if (schoolId == null || schoolId.trim().isEmpty()) {
            return "School ID is required";
        }
        if (academicYear == null || academicYear.trim().isEmpty()) {
            return "Academic year is required";
        }
        if (billNumber == null || billNumber.trim().isEmpty()) {
            return "Bill number is required";
        }
        if (billType == null || (!billType.equals("DailyFeeCollection") && !billType.equals("MiscellaneousFee"))) {
            return "Bill type must be either 'DailyFeeCollection' or 'MiscellaneousFee'";
        }
        return null;
    }
}