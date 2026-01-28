package com.backend.school_erp.entity.Library;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibraryMember {
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
    private String membershipStatus; // ACTIVE, EXPIRED
    private Integer maxBooksAllowed;

    // School context
    private String schoolId;
    private String academicYear;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}