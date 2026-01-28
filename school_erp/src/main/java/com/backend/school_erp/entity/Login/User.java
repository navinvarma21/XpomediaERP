package com.backend.school_erp.entity.Login;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "schools")
public class User {

    @Id
    private String schoolId;

    private String schoolCode; // ✅ NEW: Add schoolCode field
    private String schoolName;
    private String email;
    private String phone;
    private String password;
    private String status; // "Active" or "InActive"
    private LocalDate fromDate;
    private LocalDate toDate;
    private Boolean manualOverride = false;

    // Getters and Setters
    public String getSchoolId() {
        return schoolId;
    }
    public void setSchoolId(String schoolId) {
        this.schoolId = schoolId;
    }

    public String getSchoolCode() {
        return schoolCode; // ✅ NEW: Getter for schoolCode
    }
    public void setSchoolCode(String schoolCode) {
        this.schoolCode = schoolCode; // ✅ NEW: Setter for schoolCode
    }

    public String getSchoolName() {
        return schoolName;
    }
    public void setSchoolName(String schoolName) {
        this.schoolName = schoolName;
    }

    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }
    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }

    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getFromDate() {
        return fromDate;
    }
    public void setFromDate(LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public LocalDate getToDate() {
        return toDate;
    }
    public void setToDate(LocalDate toDate) {
        this.toDate = toDate;
    }

    public Boolean getManualOverride() {
        return manualOverride;
    }
    public void setManualOverride(Boolean manualOverride) {
        this.manualOverride = manualOverride;
    }
}