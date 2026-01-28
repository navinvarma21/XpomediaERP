package com.backend.school_erp.controller.Admin;

import com.backend.school_erp.DTO.Admin.AdminLoginRequest;
import com.backend.school_erp.entity.Admin.Admin;
import com.backend.school_erp.repository.Admin.AdminRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminRepository adminRepository;

    public AdminController(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    // ---------- Admin Login ----------
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody AdminLoginRequest request) {
        Optional<Admin> adminOpt = adminRepository.findByAdminId(request.getAdminId());

        Map<String, Object> response = new HashMap<>();
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            if (admin.getPassword().equals(request.getPassword())) {
                response.put("success", true);
                response.put("message", "Login successful");
                response.put("token", admin.getAdminId()); // use adminId as token for now
                response.put("adminName", admin.getAdminName()); // Add this line
                return ResponseEntity.ok(response);
            }
        }

        response.put("success", false);
        response.put("message", "Invalid Admin ID or Password");
        return ResponseEntity.status(401).body(response);
    }

    // ---------- Get Admin Profile ----------
    @GetMapping("/me")
    public ResponseEntity<?> getAdminProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid Authorization header");
            }

            // Extract adminId from header
            String adminId = authHeader.replace("Bearer ", "").trim();
            Optional<Admin> adminOpt = adminRepository.findByAdminId(adminId);

            if (adminOpt.isEmpty()) {
                return ResponseEntity.status(404).body("Admin not found");
            }

            Admin admin = adminOpt.get();

            // Return adminId and adminName only
            Map<String, String> profile = new HashMap<>();
            profile.put("adminId", admin.getAdminId());
            profile.put("adminName", admin.getAdminName());

            return ResponseEntity.ok(profile);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }
}

