package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.StaffDTO;
import com.backend.school_erp.entity.Administration.Staff;
import com.backend.school_erp.service.Administration.StaffService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/administration/staff")
@RequiredArgsConstructor
@Slf4j
public class StaffController {

    private final StaffService staffService;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam String schoolId, @RequestParam String academicYear) {
        try {
            log.info("Fetching staff for school: {}, academic year: {}", schoolId, academicYear);
            List<Staff> staffList = staffService.getAllStaff(schoolId, academicYear);
            return ResponseEntity.ok(staffList);
        } catch (Exception e) {
            log.error("Error fetching staff: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching staff: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> addStaff(@RequestBody StaffDTO dto) {
        try {
            log.info("Adding new staff: {}", dto.getName());
            if (dto.getSchoolId() == null || dto.getAcademicYear() == null) {
                return ResponseEntity.badRequest().body("School ID and Academic Year are required");
            }
            Staff staff = staffService.addStaff(dto);
            return ResponseEntity.ok(staff);
        } catch (Exception e) {
            log.error("Error adding staff: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error adding staff: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStaff(@PathVariable Long id,
                                         @RequestParam String schoolId,
                                         @RequestParam String academicYear, // ADDED: academicYear parameter
                                         @RequestBody StaffDTO dto) {
        try {
            log.info("Updating staff ID: {} for school: {}", id, schoolId);

            // Set schoolId and academicYear in DTO to ensure they're not null
            dto.setSchoolId(schoolId);
            dto.setAcademicYear(academicYear);

            Optional<Staff> updatedStaff = staffService.updateStaff(schoolId, id, dto);
            if (updatedStaff.isPresent()) {
                return ResponseEntity.ok(updatedStaff.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error updating staff: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error updating staff: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable Long id, @RequestParam String schoolId) {
        try {
            log.info("Deleting staff ID: {}", id);
            boolean deleted = staffService.deleteStaff(schoolId, id);
            if (deleted) {
                return ResponseEntity.ok(true);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting staff: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error deleting staff: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Long id,
                                    @RequestParam String schoolId,
                                    @RequestParam String academicYear) {
        try {
            log.info("Fetching staff by ID: {} for school: {}", id, schoolId);
            // FIXED: Use direct query instead of filtering all staff
            Optional<Staff> staff = staffService.getStaffById(schoolId, id);
            if (staff.isPresent()) {
                return ResponseEntity.ok(staff.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error fetching staff by ID: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching staff: " + e.getMessage());
        }
    }
}