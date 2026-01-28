package com.backend.school_erp.DTO.Library;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibraryMemberDTO {
    private Long id;
    private String admissionNumber;
    private String studentName;
    private String standard;
    private String section;
    private String fatherName;
    private String phoneNumber;
    private String email;

    // Membership details
    private String membershipId;
    private LocalDate membershipStartDate;
    private LocalDate membershipEndDate;
    private String membershipStatus;
    private Integer maxBooksAllowed;

    // School context
    private String schoolId;
    private String academicYear;

    // Computed fields for frontend
    private Integer issuedBooksCount;
    private Boolean isExpired;
    private Long daysUntilExpiry;
}