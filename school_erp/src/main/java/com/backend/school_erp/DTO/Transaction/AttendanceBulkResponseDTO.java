package com.backend.school_erp.DTO.Transaction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceBulkResponseDTO {
    private boolean success;
    private String message;
    private int recordsProcessed;
    private int recordsSaved;
    private int recordsUpdated;
    private LocalDateTime timestamp;
}