package com.backend.school_erp.DTO.Library;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookIssueDTO {
    // Transaction Info
    private String issueNo;
    private String memberName;
    private String memberCode; // Student Admission No or Staff ID
    private String memberType; // "STUDENT" or "STAFF"
    private String status;

    // Book Info
    private String bookQrCode;
    private String bookCode;
    private String bookName;
    private String departmentName;
    private String publisherName;
    private String authorName;
    private Integer totalAvailableQty;

    // Dates
    private LocalDate issueDate;
    private LocalDate maxReturnDate;
    private LocalDate actualReturnDate;

    // System Info
    private String schoolId;
    private String academicYear;
    private String adminStaffCode;
}