package com.backend.school_erp.entity.Teacher.Login;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherAccount {
    private Long id;
    private String schoolId;
    private String schoolCode;
    private String academicYear;
    private String username;
    private String password;
    private String role;
    private String userDetails;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isActive;
}