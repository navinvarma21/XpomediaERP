package com.backend.school_erp.entity.Administration;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MiscellaneousFeeHead {
    private Long id;
    private String feeHead;
    private String accountHead;
    private String schoolId;
    private String academicYear;
}