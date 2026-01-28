package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.*;
import com.backend.school_erp.service.Administration.RoleBasedAccountService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/administration/rolebasedaccounts")
@Slf4j
public class RoleBasedAccountController {

    @Autowired
    private RoleBasedAccountService roleBasedAccountService;

    /** Create role-based account */
    @PostMapping("/create")
    public ResponseEntity<?> createAccount(@Valid @RequestBody CreateAccountRequestDTO request) {
        try {
            log.info("Creating role-based account for school: {}, username: {}, role: {}, academic year: {}",
                    request.getSchoolId(), request.getUsername(), request.getRole(), request.getAcademicYear());

            RoleBasedAccountResponseDTO account = roleBasedAccountService.createAccount(
                    request.getSchoolId(), request);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Account created successfully",
                    "data", account
            ));
        } catch (Exception e) {
            log.error("Error creating account: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Get all accounts for school and academic year */
    @GetMapping
    public ResponseEntity<?> getAccounts(
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            List<RoleBasedAccountResponseDTO> accounts = roleBasedAccountService.getAccounts(schoolId, academicYear);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", accounts
            ));
        } catch (Exception e) {
            log.error("Error fetching accounts: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Get accounts by role */
    @GetMapping("/by-role")
    public ResponseEntity<?> getAccountsByRole(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String role) {
        try {
            if (!"TEACHER".equals(role) && !"STUDENT".equals(role)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Role must be TEACHER or STUDENT"
                ));
            }

            List<RoleBasedAccountResponseDTO> accounts = roleBasedAccountService.getAccountsByRole(
                    schoolId, academicYear, role);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", accounts
            ));
        } catch (Exception e) {
            log.error("Error fetching accounts by role: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Get account by username */
    @GetMapping("/{username}")
    public ResponseEntity<?> getAccountByUsername(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @PathVariable String username) {
        try {
            return roleBasedAccountService.getAccountByUsername(schoolId, username, academicYear)
                    .map(account -> ResponseEntity.ok(Map.of(
                            "success", true,
                            "data", account
                    )))
                    .orElse(ResponseEntity.ok(Map.of(
                            "success", true,
                            "data", null
                    )));
        } catch (Exception e) {
            log.error("Error fetching account by username: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Update password */
    @PutMapping("/{username}/password")
    public ResponseEntity<?> updatePassword(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        try {
            String newPassword = request.get("password");
            if (newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Password must be at least 6 characters"
                ));
            }

            boolean updated = roleBasedAccountService.updatePassword(schoolId, username, newPassword, academicYear);
            if (updated) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Password updated successfully"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Failed to update password - account not found"
                ));
            }
        } catch (Exception e) {
            log.error("Error updating password: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Delete account permanently */
    @DeleteMapping("/{username}/delete")
    public ResponseEntity<?> deleteAccount(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @PathVariable String username) {
        try {
            boolean deleted = roleBasedAccountService.deleteAccount(schoolId, username, academicYear);
            if (deleted) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Account deleted successfully"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Failed to delete account - account not found"
                ));
            }
        } catch (Exception e) {
            log.error("Error deleting account: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Verify password */
    @PostMapping("/{username}/verify-password")
    public ResponseEntity<?> verifyPassword(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        try {
            String password = request.get("password");
            if (password == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Password is required"
                ));
            }

            boolean verified = roleBasedAccountService.verifyPassword(schoolId, username, password, academicYear);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "verified", verified
            ));
        } catch (Exception e) {
            log.error("Error verifying password: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /** Check if username exists */
    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsernameExists(
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam String username) {
        try {
            boolean exists = roleBasedAccountService.usernameExists(schoolId, username, academicYear);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "exists", exists
            ));
        } catch (Exception e) {
            log.error("Error checking username: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}