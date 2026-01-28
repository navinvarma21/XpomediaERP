package com.backend.school_erp.entity.Administration;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StateDistrict {
    private Long id;
    private String name;          // state or district name
    private String type;          // "state" or "district"
    private Long stateId;         // 👈 NEW: For districts, reference to parent state
    private String schoolId;
    private LocalDateTime createdAt;
}