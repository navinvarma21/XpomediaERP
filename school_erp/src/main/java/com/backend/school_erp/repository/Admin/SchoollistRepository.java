package com.backend.school_erp.repository.Admin;

import com.backend.school_erp.entity.Admin.Schoollist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SchoollistRepository extends JpaRepository<Schoollist, String> {
    // Custom query methods
    boolean existsBySchoolName(String schoolName);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsBySchoolCode(String schoolCode); // ✅ New method
    Optional<Schoollist> findBySchoolCode(String schoolCode); // ✅ New method
}