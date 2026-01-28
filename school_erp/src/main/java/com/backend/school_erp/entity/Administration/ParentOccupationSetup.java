package com.backend.school_erp.entity.Administration;

import lombok.Builder;
import lombok.Data;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor // ✅ add this
@AllArgsConstructor
@Builder
public class ParentOccupationSetup {
    private Long id;
    private String occupation;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
}

