package com.backend.school_erp.entity.Transport;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Place {
    private Long id;
    private String placeName;
    private String routeNumber;
    private String driverName;
    private String conductorName;
    private String schoolId;
    private String academicYear;
}