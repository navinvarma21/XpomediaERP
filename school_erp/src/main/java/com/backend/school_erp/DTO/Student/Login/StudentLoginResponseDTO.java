package com.backend.school_erp.DTO.Student.Login;

import lombok.*;
import com.fasterxml.jackson.annotation.JsonInclude;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudentLoginResponseDTO {
    private boolean success;
    private String message;
    private String token;
    private String studentId;
    private String studentName;
    private String schoolCode;
    private String schoolName;
    private String schoolId;
    private Object userDetails;

    // Success constructor
    public StudentLoginResponseDTO(boolean success, String token, String studentId,
                                   String studentName, String schoolCode,
                                   String schoolName, String schoolId, Object userDetails) {
        this.success = success;
        this.token = token;
        this.studentId = studentId;
        this.studentName = studentName;
        this.schoolCode = schoolCode;
        this.schoolName = schoolName;
        this.schoolId = schoolId;
        this.userDetails = userDetails;
        this.message = "Login successful";
    }

    // Error constructor
    public StudentLoginResponseDTO(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
}