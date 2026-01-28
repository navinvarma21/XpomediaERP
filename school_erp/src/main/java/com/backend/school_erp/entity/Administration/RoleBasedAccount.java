package com.backend.school_erp.entity.Administration;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleBasedAccount {
    private Long id;
    private String schoolId;
    private String schoolCode;
    private String academicYear;
    private String username;
    private String password; // Encrypted password
    private String role; // TEACHER or STUDENT
    private String userDetails; // JSON string containing user details
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isActive;
}