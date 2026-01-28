package com.backend.school_erp.entity.Admin;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "schools")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class School {
    @Id
    private String schoolId;

    @Column(nullable = false, unique = true, length = 10) // ✅ New field
    private String schoolCode;

    @Column(nullable = false, unique = true)
    private String schoolName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(nullable = false)
    private String password; // ⚠️ Later hash this with BCrypt

    @Column(nullable = false)
    private String status = "Active"; // ✅ Status field with default value

    @Column(nullable = false)
    private LocalDate fromDate; // ✅ New fromDate field

    @Column(nullable = false)
    private LocalDate toDate; // ✅ New toDate field

    @Column(nullable = false)
    private Boolean manualOverride = false; // ✅ Add this field
}