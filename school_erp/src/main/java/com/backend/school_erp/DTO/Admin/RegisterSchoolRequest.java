package com.backend.school_erp.DTO.Admin;

import lombok.Data;
import java.time.LocalDate;

@Data
public class RegisterSchoolRequest {
    private String schoolId;
    private String schoolCode; // ✅ New field
    private String schoolName;
    private String email;
    private String phone;
    private String password;
    private String status; // ✅ Status field
    private LocalDate fromDate; // ✅ New fromDate field
    private LocalDate toDate; // ✅ New toDate field
}