package com.backend.school_erp.DTO.Transport;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BusFeeDTO {
    private String boardingPoint;
    private String routeNumber;
    private String feeHeading;
    private Double fee;
    private String academicYear;
}