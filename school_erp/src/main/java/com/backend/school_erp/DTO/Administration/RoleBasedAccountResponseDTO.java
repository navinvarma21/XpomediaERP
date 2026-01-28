package com.backend.school_erp.DTO.Administration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Response DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleBasedAccountResponseDTO {
    private Long id;
    private String schoolId;
    private String schoolCode;
    private String academicYear;
    private String username;
    private String role;
    private Object userDetails;
    private String createdAt;
    private Boolean isActive;
}