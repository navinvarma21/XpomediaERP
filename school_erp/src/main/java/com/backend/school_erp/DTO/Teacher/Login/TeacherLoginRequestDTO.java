package com.backend.school_erp.DTO.Teacher.Login;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherLoginRequestDTO {
    private String schoolCode;
    private String userName;
    private String password;
}