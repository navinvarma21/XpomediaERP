package com.backend.school_erp.DTO.Transaction;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffResponseDTO {
    private String staffCode;
    private String name;
    private String designation;
    private String category;
    private String mobileNumber;
    private String status;
}
