package com.backend.school_erp.DTO.Transaction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceCheckResponseDTO {
    private boolean exists;
    private String attendanceStatus;
}