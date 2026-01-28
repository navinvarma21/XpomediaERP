package com.backend.school_erp.repository.Admin;


import com.backend.school_erp.entity.Admin.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, String> {
    Optional<Admin> findByAdminId(String adminId);
}
