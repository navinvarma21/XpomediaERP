package com.backend.school_erp.entity.Transport;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusVanFeeHead {
    private Long id;
    private String feeHead;
    private String accountHead;
    private String schoolId;
    private String academicYear;
}