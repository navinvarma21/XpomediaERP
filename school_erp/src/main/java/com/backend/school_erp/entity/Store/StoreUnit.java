package com.backend.school_erp.entity.Store;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreUnit {
    private Long id;
    private String unitName;
    private String schoolId;
    private String academicYear;
}