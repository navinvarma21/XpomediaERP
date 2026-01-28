package com.backend.school_erp.controller.Admin;

import com.backend.school_erp.DTO.Admin.RegisterSchoolRequest;
import com.backend.school_erp.entity.Admin.School;
import com.backend.school_erp.service.Admin.SchoolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/schools")
public class SchoolController {

    @Autowired
    private SchoolService schoolService;

    @PostMapping("/register")
    public ResponseEntity<?> registerSchool(@RequestBody RegisterSchoolRequest request) {
        try {
            School savedSchool = schoolService.registerSchool(request);
            return ResponseEntity.ok(savedSchool);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse("400", e.getMessage())
            );
        }
    }

    // ✅ Helper response for errors
    record ErrorResponse(String code, String message) {}
}