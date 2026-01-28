package com.backend.school_erp.DTO.Library;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibraryBookIssueDTO {
    private Long id;
    private String admissionNumber;
    private String studentName;
    private String standard;
    private String section;
    private String membershipId;

    private String bookId;
    private String bookTitle;
    private String authorName;
    private String isbn;

    private LocalDate issuedDate;
    private LocalDate dueDate;
    private LocalDate returnedDate;
    private String status;

    private Double fineAmount;
    private String remarks;

    // School context
    private String schoolId;
    private String academicYear;

    // Computed fields
    private Boolean isOverdue;
    private Long daysOverdue;
    private String memberStatus;
}