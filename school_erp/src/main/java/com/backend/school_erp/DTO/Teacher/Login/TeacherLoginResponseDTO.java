package com.backend.school_erp.DTO.Teacher.Login;

import lombok.*;
import com.fasterxml.jackson.annotation.JsonInclude;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TeacherLoginResponseDTO {
    private boolean success;
    private String message;
    private String token;
    private String teacherId;
    private String teacherName;
    private String schoolCode;
    private String schoolName;
    private String schoolId;
    private Object userDetails;

    // Success constructor
    public TeacherLoginResponseDTO(boolean success, String token, String teacherId,
                                   String teacherName, String schoolCode,
                                   String schoolName, String schoolId, Object userDetails) {
        this.success = success;
        this.token = token;
        this.teacherId = teacherId;
        this.teacherName = teacherName;
        this.schoolCode = schoolCode;
        this.schoolName = schoolName;
        this.schoolId = schoolId;
        this.userDetails = userDetails;
        this.message = "Login successful";
    }

    // Error constructor
    public TeacherLoginResponseDTO(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
}