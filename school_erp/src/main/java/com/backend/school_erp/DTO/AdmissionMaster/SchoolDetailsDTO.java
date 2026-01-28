package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolDetailsDTO {
    private String schoolName;
    private String schoolAddress;
    private String city;
    private String state;
    private String pincode;
    private String email;
    private String phoneNumber;
    private byte[] profileImage;
    private String profileImageType; // Add this field
}