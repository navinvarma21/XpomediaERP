package com.backend.school_erp.DTO.Store;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookSetupClassDTO {
    private List<String> standards;
    private LocalDate entryDate;
    private List<BookEntry> books;
    private String academicYear;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookEntry {
        private String bookId;
        private Integer quantity;
        private Double amount;
    }
}