package com.backend.school_erp.DTO.Store;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookDTO {
    private String bookCode; // 👈 New Field
    private String bookName;
    private String academicYear;
}