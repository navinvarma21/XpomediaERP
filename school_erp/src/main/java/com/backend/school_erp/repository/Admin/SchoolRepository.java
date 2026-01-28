package com.backend.school_erp.repository.Admin;

import com.backend.school_erp.entity.Admin.School;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SchoolRepository extends JpaRepository<School, String> {
    Optional<School> findByEmail(String email);
    Optional<School> findByPhone(String phone);
    Optional<School> findBySchoolCode(String schoolCode); // ✅ New method
}