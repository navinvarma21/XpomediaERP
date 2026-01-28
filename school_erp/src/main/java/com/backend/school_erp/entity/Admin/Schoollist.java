package com.backend.school_erp.entity.Admin;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "schools")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Schoollist {
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
    private String password;

    @Column(nullable = false)
    private String status = "Active";

    @Column(nullable = false)
    private LocalDate fromDate;

    @Column(nullable = false)
    private LocalDate toDate;

    // ✅ Track manual override
    @Column(nullable = false)
    private Boolean manualOverride = false;
}