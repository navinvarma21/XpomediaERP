package com.backend.school_erp.entity.Student.Login;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "schools", schema = "xpo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SSchoolEntity {
    @Id
    @Column(name = "school_id")
    private String schoolId;

    @Column(name = "email")
    private String email;

    @Column(name = "password")
    private String password;

    @Column(name = "phone")
    private String phone;

    @Column(name = "school_name")
    private String schoolName;

    @Column(name = "current_academic_year")
    private String currentAcademicYear;

    @Column(name = "status")
    private String status;

    @Column(name = "from_date")
    private LocalDate fromDate;

    @Column(name = "to_date")
    private LocalDate toDate;

    @Column(name = "manual_override")
    private Boolean manualOverride;

    @Column(name = "school_code")
    private String schoolCode;
}