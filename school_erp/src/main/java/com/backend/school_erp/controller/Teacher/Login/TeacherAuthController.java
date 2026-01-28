package com.backend.school_erp.controller.Teacher.Login;

import com.backend.school_erp.DTO.Teacher.Login.TeacherLoginRequestDTO;
import com.backend.school_erp.DTO.Teacher.Login.TeacherLoginResponseDTO;
import com.backend.school_erp.service.Teacher.Login.TeacherAuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/teachers")
@Slf4j
public class TeacherAuthController {

    private final TeacherAuthService teacherAuthService;

    public TeacherAuthController(TeacherAuthService teacherAuthService) {
        this.teacherAuthService = teacherAuthService;
    }

    @PostMapping("/login")
    public ResponseEntity<TeacherLoginResponseDTO> teacherLogin(
            @Valid @RequestBody TeacherLoginRequestDTO loginRequest) {

        log.info("Teacher login attempt for school: {}, username: {}",
                loginRequest.getSchoolCode(), loginRequest.getUserName());

        TeacherLoginResponseDTO response = teacherAuthService.teacherLogin(loginRequest);

        if (response.isSuccess()) {
            log.info("Teacher login successful for: {}", loginRequest.getUserName());
            return ResponseEntity.ok(response);
        } else {
            log.warn("Teacher login failed for: {} - {}",
                    loginRequest.getUserName(), response.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Teacher Auth Service is running");
    }
}