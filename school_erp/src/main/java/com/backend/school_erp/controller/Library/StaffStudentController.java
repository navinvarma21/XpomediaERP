package com.backend.school_erp.controller.Library;

import com.backend.school_erp.DTO.Administration.StaffStudentDTO;
import com.backend.school_erp.entity.Administration.StaffStudent;
import com.backend.school_erp.service.Library.StaffStudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/administration/staffstudent")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class StaffStudentController {

    private final StaffStudentService service;

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        try {
            List<StaffStudent> records = service.getAll(schoolId, academicYear);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching records: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(
            @PathVariable Long id,
            @RequestParam String schoolId
    ) {
        try {
            Optional<StaffStudent> record = service.getById(schoolId, id);
            if (record.isPresent()) {
                return ResponseEntity.ok(record.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching details: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody StaffStudentDTO dto) {
        try {
            Optional<StaffStudent> newRecord = service.create(dto);
            if (newRecord.isPresent()) {
                return ResponseEntity.ok(newRecord.get());
            } else {
                return ResponseEntity.badRequest().body("Failed to create record");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating record: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody StaffStudentDTO dto
    ) {
        try {
            Optional<StaffStudent> updatedRecord = service.update(dto.getSchoolId(), id, dto);
            if (updatedRecord.isPresent()) {
                return ResponseEntity.ok(updatedRecord.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating record: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @RequestParam String schoolId
    ) {
        try {
            boolean deleted = service.delete(schoolId, id);
            if (deleted) {
                return ResponseEntity.ok("Deleted successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting record: " + e.getMessage());
        }
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<?> getByType(
            @PathVariable String type,
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        try {
            List<StaffStudent> records = service.getByType(schoolId, academicYear, type);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching by type: " + e.getMessage());
        }
    }
}