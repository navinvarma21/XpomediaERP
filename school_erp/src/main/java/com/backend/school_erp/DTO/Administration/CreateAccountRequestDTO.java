package com.backend.school_erp.DTO.Administration;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Request DTO for account creation
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAccountRequestDTO {
    @NotBlank(message = "School ID is required")
    private String schoolId;

    @NotBlank(message = "School code is required")
    private String schoolCode;

    @NotBlank(message = "Academic year is required")
    private String academicYear;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Role is required")
    private String role;

    private Object userDetails; // Flexible object for user details
}