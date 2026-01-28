package com.backend.school_erp.DTO;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String mobile;
    private String role;
    private String password;
}
