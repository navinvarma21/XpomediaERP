package com.backend.school_erp.controller.Student.Login;

import com.backend.school_erp.DTO.Student.Login.StudentLoginRequestDTO;
import com.backend.school_erp.DTO.Student.Login.StudentLoginResponseDTO;
import com.backend.school_erp.service.Student.Login.StudentAuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/students")
@Slf4j
public class StudentAuthController {

    private final StudentAuthService studentAuthService;

    public StudentAuthController(StudentAuthService studentAuthService) {
        this.studentAuthService = studentAuthService;
    }

    @PostMapping("/login")
    public ResponseEntity<StudentLoginResponseDTO> studentLogin(
            @Valid @RequestBody StudentLoginRequestDTO loginRequest) {

        log.info("Student login attempt for school: {}, username: {}",
                loginRequest.getSchoolCode(), loginRequest.getUserName());

        StudentLoginResponseDTO response = studentAuthService.studentLogin(loginRequest);

        if (response.isSuccess()) {
            log.info("Student login successful for: {}", loginRequest.getUserName());
            return ResponseEntity.ok(response);
        } else {
            log.warn("Student login failed for: {} - {}",
                    loginRequest.getUserName(), response.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Student Auth Service is running");
    }
}