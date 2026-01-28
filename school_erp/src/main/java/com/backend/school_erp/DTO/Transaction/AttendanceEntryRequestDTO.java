package com.backend.school_erp.DTO.Transaction;

import lombok.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceEntryRequestDTO {
    @NotBlank(message = "School ID is required")
    private String schoolId;

    @NotBlank(message = "Academic year is required")
    private String academicYear;

    @NotBlank(message = "Standard is required")
    private String standard;

    @NotBlank(message = "Section is required")
    private String section;

    @NotNull(message = "Attendance date is required")
    private LocalDate attendanceDate;

    @NotEmpty(message = "Attendance records cannot be empty")
    private List<AttendanceRecordDTO> attendanceRecords;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttendanceRecordDTO {
        @NotNull(message = "Student ID is required")
        private Long studentId;

        @NotBlank(message = "Admission number is required")
        private String admissionNumber;

        @NotBlank(message = "Student name is required")
        private String studentName;

        @NotBlank(message = "Attendance status is required")
        @Pattern(regexp = "^(P|A|L|H)$", message = "Attendance status must be P, A, L, or H")
        private String attendanceStatus;

        @NotBlank(message = "Standard is required")
        private String standard;

        @NotBlank(message = "Section is required")
        private String section;
    }
}