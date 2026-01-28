package com.backend.school_erp.controller.Admin;

import com.backend.school_erp.entity.Admin.Schoollist;
import com.backend.school_erp.service.Admin.SchoolsListService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/schools")
public class SchoolsListController {

    private final SchoolsListService schoolsListService;

    public SchoolsListController(SchoolsListService schoolsListService) {
        this.schoolsListService = schoolsListService;
    }

    // ✅ Get all schools
    @GetMapping
    public ResponseEntity<List<Schoollist>> getAllSchools() {
        return ResponseEntity.ok(schoolsListService.getAllSchools());
    }

    // ✅ Get school by ID
    @GetMapping("/{id}")
    public ResponseEntity<Schoollist> getSchoolById(@PathVariable String id) {
        return schoolsListService.getSchoolById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Create new school
    @PostMapping
    public ResponseEntity<Schoollist> createSchool(@RequestBody Schoollist school) {
        return ResponseEntity.ok(schoolsListService.saveSchool(school));
    }

    // ✅ Update school
    @PutMapping("/{id}")
    public ResponseEntity<Schoollist> updateSchool(@PathVariable String id, @RequestBody Schoollist updatedSchool) {
        Schoollist school = schoolsListService.updateSchool(id, updatedSchool);
        return ResponseEntity.ok(school);
    }

    // ✅ Update school status only with manual override support - FIXED
    @PutMapping("/{id}/status")
    public ResponseEntity<Schoollist> updateSchoolStatus(@PathVariable String id, @RequestBody Map<String, Object> statusRequest) {
        String status = (String) statusRequest.get("status");
        Boolean manualOverride = (Boolean) statusRequest.get("manualOverride");

        if (status == null || (!status.equals("Active") && !status.equals("InActive"))) {
            return ResponseEntity.badRequest().build();
        }

        // Default to true when admin manually toggles status
        boolean isManualOverride = manualOverride != null ? manualOverride : true;

        Schoollist school = schoolsListService.updateSchoolStatus(id, status, isManualOverride);
        return ResponseEntity.ok(school);
    }

    // ✅ Check if school status is manual override
    @GetMapping("/{id}/isManualOverride")
    public ResponseEntity<Map<String, Boolean>> isManualOverride(@PathVariable String id) {
        boolean isManualOverride = schoolsListService.isManualOverride(id);
        return ResponseEntity.ok(Map.of("manualOverride", isManualOverride));
    }

    // ✅ Delete school
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchool(@PathVariable String id) {
        schoolsListService.deleteSchool(id);
        return ResponseEntity.noContent().build();
    }
}