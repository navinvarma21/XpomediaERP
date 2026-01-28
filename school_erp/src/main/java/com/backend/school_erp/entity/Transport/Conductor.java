package com.backend.school_erp.entity.Transport;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conductor {
    private Long id;
    private String conductor;
    private String schoolId;
    private String academicYear;
}