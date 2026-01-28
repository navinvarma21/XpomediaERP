package com.backend.school_erp.DTO.Transaction;


import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffPhoneUpdateDTO {
    private String schoolId;
    private String academicYear;
    private String staffCode;
    private String newPhoneNumber;
    private String updatedBy;
}