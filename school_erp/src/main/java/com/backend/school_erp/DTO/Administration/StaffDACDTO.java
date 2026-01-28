package com.backend.school_erp.DTO.Administration;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDACDTO {
    private String name;
    private String type;          // 👈 NEW field
    private String schoolId;
    private String academicYear;
}
