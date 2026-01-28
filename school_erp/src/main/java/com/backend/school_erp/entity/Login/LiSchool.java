package com.backend.school_erp.entity.Login;


import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "schools")
public class LiSchool {

    @Id
    private String schoolId;

    private String schoolName;

    private String currentAcademicYear;

    // Getters & Setters
    public String getSchoolId() { return schoolId; }
    public void setSchoolId(String schoolId) { this.schoolId = schoolId; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public String getCurrentAcademicYear() { return currentAcademicYear; }
    public void setCurrentAcademicYear(String currentAcademicYear) { this.currentAcademicYear = currentAcademicYear; }
}

