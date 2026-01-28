package com.backend.school_erp.DTO.Admin;


public class AdminLoginRequest {
    private String adminId;
    private String password;

    // getters and setters
    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

