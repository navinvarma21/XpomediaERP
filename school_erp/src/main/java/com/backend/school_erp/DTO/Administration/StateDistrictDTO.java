package com.backend.school_erp.DTO.Administration;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StateDistrictDTO {
    private String name;
    private String type;      // "state" or "district"
    private Long stateId;     // 👈 NEW: For districts
    private String schoolId;
}