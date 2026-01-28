package com.backend.school_erp.entity.Store;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Book {
    private Long id;
    private String bookCode; // 👈 New Field
    private String bookName;
    private String schoolId;
    private String academicYear;
}