package com.backend.school_erp.DTO.Administration;

import lombok.*;
import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleBasedAccountDTO {
    @NotBlank(message = "School ID is required")
    private String schoolId;

    @NotBlank(message = "School code is required")
    private String schoolCode;

    @NotBlank(message = "Academic year is required")
    private String academicYear;

    @NotBlank(message = "Username is required")
    @Size(min = 3, message = "Username must be at least 3 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "TEACHER|STUDENT", message = "Role must be TEACHER or STUDENT")
    private String role;

    private UserDetailsDTO userDetails;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserDetailsDTO {
        private String staffId; // For teachers
        private String admissionNo; // For students
        private String name;
        private String className; // For students
        private String section; // For students
        private String schoolCode;
        private String username;
        private String designation; // For teachers
    }
}




