package com.backend.school_erp.entity.Transport;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusFee {
    private Long id;
    private String boardingPoint;
    private String routeNumber;
    private String feeHeading;
    private Double fee;
    private String schoolId;
    private String academicYear;
}