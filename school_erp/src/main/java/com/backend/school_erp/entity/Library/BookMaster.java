package com.backend.school_erp.entity.Library;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookMaster {
    private Long id;
    private String bookCode; // e.g., BOOK001
    private String bookName;
    private String authorName;
    private String publisherName;
    private String language;
    private String departmentName;
    private String schoolId;
    private String academicYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}