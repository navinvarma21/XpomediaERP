package com.backend.school_erp.DTO.Admin;

import lombok.Data;

// ✅ NEW DTO for status update
@Data
class StatusUpdateRequest {
    private String status;
    private Boolean manualOverride;
}
