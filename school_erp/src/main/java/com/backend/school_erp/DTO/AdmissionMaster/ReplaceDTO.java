package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.Data;

@Data
public class ReplaceDTO {
    private String admissionNumber;
    private String phoneNumberToUpdate; // "phone1" or "phone2"
    private String newPhoneNumber;
    private String section;
    private String schoolId;
    private String academicYear;

    public String validateForPhoneReplacement() {
        if (admissionNumber == null || admissionNumber.trim().isEmpty()) {
            return "Admission number is required";
        }
        if (phoneNumberToUpdate == null || phoneNumberToUpdate.trim().isEmpty()) {
            return "Phone number to update is required";
        }
        if (!phoneNumberToUpdate.equals("phone1") && !phoneNumberToUpdate.equals("phone2")) {
            return "Phone number to update must be either 'phone1' or 'phone2'";
        }
        if (newPhoneNumber == null || newPhoneNumber.trim().isEmpty()) {
            return "New phone number is required";
        }
        if (!newPhoneNumber.matches("\\d{10}")) {
            return "Phone number must be exactly 10 digits";
        }
        if (schoolId == null || schoolId.trim().isEmpty()) {
            return "School ID is required";
        }
        if (academicYear == null || academicYear.trim().isEmpty()) {
            return "Academic year is required";
        }
        return null;
    }

    public String validateForSectionReplacement() {
        if (admissionNumber == null || admissionNumber.trim().isEmpty()) {
            return "Admission number is required";
        }
        if (section == null || section.trim().isEmpty()) {
            return "Section is required";
        }
        if (schoolId == null || schoolId.trim().isEmpty()) {
            return "School ID is required";
        }
        if (academicYear == null || academicYear.trim().isEmpty()) {
            return "Academic year is required";
        }
        return null;
    }
}