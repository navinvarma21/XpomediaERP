package com.backend.school_erp.DTO.Login;

import java.time.LocalDate;

public class LoginResponse {
    private String token;
    private String id;         // ✅ alias for schoolId
    private String schoolId;
    private String schoolCode; // ✅ NEW: Add schoolCode
    private String schoolName;
    private String email;
    private String status;     // ✅ Add status
    private LocalDate fromDate; // ✅ Add fromDate
    private LocalDate toDate;   // ✅ Add toDate

    public LoginResponse(String token, String schoolId, String schoolCode, String schoolName, String email,
                         String status, LocalDate fromDate, LocalDate toDate) {
        this.token = token;
        this.id = schoolId;       // ✅ assign alias
        this.schoolId = schoolId;
        this.schoolCode = schoolCode; // ✅ NEW: Initialize schoolCode
        this.schoolName = schoolName;
        this.email = email;
        this.status = status;     // ✅ Initialize status
        this.fromDate = fromDate; // ✅ Initialize fromDate
        this.toDate = toDate;     // ✅ Initialize toDate
    }

    // getters
    public String getToken() {
        return token;
    }
    public String getId() {
        return id;
    }
    public String getSchoolId() {
        return schoolId;
    }
    public String getSchoolCode() {
        return schoolCode; // ✅ NEW: Getter for schoolCode
    }
    public String getSchoolName() {
        return schoolName;
    }
    public String getEmail() {
        return email;
    }
    public String getStatus() {
        return status;
    }
    public LocalDate getFromDate() {
        return fromDate;
    }
    public LocalDate getToDate() {
        return toDate;
    }
}