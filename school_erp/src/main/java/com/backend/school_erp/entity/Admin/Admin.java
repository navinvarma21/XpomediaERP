package com.backend.school_erp.entity.Admin;


import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "admin")
public class Admin {
    @Id
    private String adminId;
    private String password;
    private String adminName;

    // getters and setters
    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }



    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }

}
