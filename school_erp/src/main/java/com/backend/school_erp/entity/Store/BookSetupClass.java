package com.backend.school_erp.entity.Store;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookSetupClass {
    private Long id;
    private String standard;
    private String bookId;
    private Integer quantity;
    private Double amount;
    private LocalDate entryDate;
    private String schoolId;
    private String academicYear;
}