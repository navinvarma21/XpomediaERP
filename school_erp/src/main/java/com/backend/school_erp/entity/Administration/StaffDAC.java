package com.backend.school_erp.entity.Administration;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDAC {
    private Long id;
    private String name;
    private String type;          // 👈 NEW field
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
}
