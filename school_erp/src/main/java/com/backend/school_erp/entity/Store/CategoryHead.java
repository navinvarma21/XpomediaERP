package com.backend.school_erp.entity.Store;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryHead {
    private Long id;
    private String categoryName;
    private String accountHead;
    private String schoolId;
    private String academicYear;
}