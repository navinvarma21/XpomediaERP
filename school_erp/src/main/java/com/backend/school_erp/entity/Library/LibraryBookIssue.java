package com.backend.school_erp.entity.Library;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibraryBookIssue {
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
    private String status; // ISSUED, RETURNED, OVERDUE

    private Double fineAmount;
    private String remarks;

    private String schoolId;
    private String academicYear;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}