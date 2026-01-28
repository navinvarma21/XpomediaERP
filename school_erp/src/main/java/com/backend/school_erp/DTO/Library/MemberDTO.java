package com.backend.school_erp.DTO.Library;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberDTO {
    private String memberCode;
    private String memberName;
    private String memberType; // STUDENT or STAFF
    private String className; // For students only
    private String section; // For students only
    private String phone; // For staff only
    private String email; // For staff only
}