package com.backend.school_erp.DTO.Library;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookDetailDTO {
    private Long id;
    private String bookId;
    private String isbn;
    private String bookCoverPhotoPath;
    private String bookTitle;
    private String authorName;
    private String category;
    private String edition;
    private String publisher;
    private Integer totalCopies;
    private Integer availableCopies;
    private String bookStatus;
    private String schoolId;
    private String academicYear;
    private String language;
    private Integer pages;
    private String publishedDate;
    private String description;

    // New pricing fields
    private BigDecimal purchaseRate;
    private BigDecimal sellingRate;
    private BigDecimal mrp;
}