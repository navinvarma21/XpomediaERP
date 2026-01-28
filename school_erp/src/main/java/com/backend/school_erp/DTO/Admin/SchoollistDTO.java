package com.backend.school_erp.DTO.Admin;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SchoollistDTO {
    private String schoolId;
    private String schoolCode; // ✅ New field
    private String schoolName;
    private String email;
    private String phone;
    private String password;
    private String status;
    private LocalDate fromDate;
    private LocalDate toDate;
    private Boolean manualOverride;
}