package com.backend.school_erp.DTO.Student.Login;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentLoginRequestDTO {
    private String schoolCode;
    private String userName;
    private String password;
}
