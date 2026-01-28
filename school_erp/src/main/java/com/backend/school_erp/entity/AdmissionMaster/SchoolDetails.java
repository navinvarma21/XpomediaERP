package com.backend.school_erp.entity.AdmissionMaster;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolDetails {
    private Long id;
    private String schoolName;
    private String schoolAddress;
    private String city;
    private String state;
    private String pincode;
    private String schoolId;
    private String email;
    private String phoneNumber;
    private byte[] profileImage;
    private String profileImageType; // Add this field
    private String createdBy;
    private String createdAt;
    private String updatedBy;
    private String updatedAt;
}