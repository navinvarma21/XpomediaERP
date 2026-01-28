package com.backend.school_erp.DTO.Library;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberInfoDTO {
    private String memberCode;
    private String memberName;
    private String memberType;
    private String className;
    private String section;
    private String phone;
    private String email;

    // Borrowing limits and counts
    private int maxBooksAllowed;
    private int currentlyBorrowed;
    private int canBorrowMore;

    // Overdue info
    private int overdueBooks;
    private double totalFineDue;

    // Recent history
    private List<Map<String, Object>> recentIssues;
}