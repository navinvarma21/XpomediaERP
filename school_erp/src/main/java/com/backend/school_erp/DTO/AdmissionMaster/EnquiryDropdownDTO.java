package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnquiryDropdownDTO {
    private Long id;
    private String name;

    // Specific fields for different dropdown types
    private String nationality;
    private String religion;
    private String community;
    private String caste;
    private String state;
    private String district;
    private String section;
    private String motherTongue;
    private String studentCategory;
    private String standard;
    private String parentOccupation;
    private String bloodGroup;
    private String boardingPoint;
    private String route;
    private String feeHead;
    private String feeAmount;

    // For fee structures
    private Double amount;
    private String type;
    private String heading;
}