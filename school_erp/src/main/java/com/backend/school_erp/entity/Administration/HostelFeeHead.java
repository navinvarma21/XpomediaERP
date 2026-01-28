package com.backend.school_erp.entity.Administration;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostelFeeHead {
    private Long id;
    private String feeHead;
    private String accountHead;
    private String schoolId;
    private String year;
}
