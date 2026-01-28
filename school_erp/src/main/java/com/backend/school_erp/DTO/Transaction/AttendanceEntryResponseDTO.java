package com.backend.school_erp.DTO.Transaction;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceEntryResponseDTO {
    private Long id;
    private String schoolId;
    private String academicYear;
    private String standard;
    private String section;
    private LocalDate attendanceDate;
    private Long studentId;
    private String admissionNumber;
    private String studentName;
    private String attendanceStatus;
    private LocalDateTime createdAt;
}
