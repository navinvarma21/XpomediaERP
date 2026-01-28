package com.backend.school_erp.DTO.Transport;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlaceDTO {
    private String placeName;
    private String routeNumber;
    private String driverName;
    private String conductorName;
    private String academicYear;
}