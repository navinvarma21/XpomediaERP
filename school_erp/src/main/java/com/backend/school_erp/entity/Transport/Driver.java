package com.backend.school_erp.entity.Transport;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Driver {
    private Long id;
    private String driver;
    private String schoolId;
    private String academicYear;
}