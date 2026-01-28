package com.backend.school_erp.entity.Administration;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityAndCasteSetup {
    private Long id;
    private String name;         // caste/community/religion/nationality
    private String type;         // "Caste", "Community", "Religion", "Nationality"
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
}
