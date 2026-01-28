package com.backend.school_erp.entity.Transport;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Route {
    private Long id;
    private String route;
    private String schoolId;
    private String academicYear;
}