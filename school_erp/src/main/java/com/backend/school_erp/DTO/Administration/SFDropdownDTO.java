package com.backend.school_erp.DTO.Administration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SFDropdownDTO {
    private Long id;
    private String name;

    // For State/District
    private String state;
    private String district;
    private Long stateId;
    private String type;

    // For Community/Caste/Religion/Nationality
    private String community;
    private String caste;
    private String religion;
    private String nationality;

    // For Staff Designation/Category
    private String designation;  // Changed from staffdesignation
    private String category;     // Changed from staffcategory

    // For Courses
    private String standard;

    // Add getters for frontend compatibility
    public String getStaffdesignation() { return designation; }
    public String getStaffcategory() { return category; }
}