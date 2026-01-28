package com.backend.school_erp.controller.Login;

import com.backend.school_erp.DTO.Login.LoginRequest;
import com.backend.school_erp.DTO.Login.LoginResponse;
import com.backend.school_erp.service.Login.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // Return specific error messages for access denial cases
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());

            if (e.getMessage().contains("Invalid email or password")) {
                return ResponseEntity.status(401).body(errorResponse);
            } else {
                // Access denied due to status/date restrictions
                return ResponseEntity.status(403).body(errorResponse);
            }
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "An unexpected error occurred. Please try again.");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}