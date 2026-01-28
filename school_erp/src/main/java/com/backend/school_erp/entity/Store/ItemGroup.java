package com.backend.school_erp.entity.Store;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemGroup {
    private Long id;
    private String groupName;
    private String schoolId;
    private String academicYear;
}