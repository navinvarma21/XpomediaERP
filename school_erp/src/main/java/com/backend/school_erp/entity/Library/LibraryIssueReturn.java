package com.backend.school_erp.entity.Library;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibraryIssueReturn {
    private Long id;
    private String issueNo;           // Unique Issue ID (e.g., ISS-2024-001)
    private String adminStaffCode;    // Who issued/received it?
    private String memberName;        // Name of Student/Staff borrowing
    private String memberCode;        // ID of Student/Staff

    private String bookQrCode;        // The specific copy
    private String bookCode;          // The Title ID
    private String bookName;
    private String departmentName;
    private String publisherName;
    private String authorName;

    private LocalDate issueDate;
    private LocalDate maxReturnDate;  // Due Date
    private LocalDate actualReturnDate;

    private String status;            // ISSUED, RETURNED, OVERDUE
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
}