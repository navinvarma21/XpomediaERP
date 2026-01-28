package com.backend.school_erp.DTO.Administration;

import lombok.Data;

@Data
public class CommunityAndCasteSetupDTO {
    private String name; // name of caste/community/etc
    private String type; // "Caste", "Community", "Religion", "Nationality"
    private String schoolId;
    private String academicYear;
}
