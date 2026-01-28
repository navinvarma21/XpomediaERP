package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.CustomerStaffDTO;
import com.backend.school_erp.entity.Store.CustomerStaff;
import com.backend.school_erp.service.Store.CustomerStaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/store/customerstaff")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class CustomerStaffController {

    private final CustomerStaffService service;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam String schoolId, @RequestParam String academicYear) {
        try {
            List<CustomerStaff> customerStaffList = service.getAll(schoolId, academicYear);
            return ResponseEntity.ok(customerStaffList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching customer/staff: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Long id, @RequestParam String schoolId) {
        try {
            Optional<CustomerStaff> customerStaff = service.getById(schoolId, id);
            if (customerStaff.isPresent()) {
                return ResponseEntity.ok(customerStaff.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching details: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CustomerStaffDTO dto) {
        try {
            Optional<CustomerStaff> newCustomerStaff = service.create(dto);
            if (newCustomerStaff.isPresent()) {
                return ResponseEntity.ok(newCustomerStaff.get());
            } else {
                return ResponseEntity.badRequest().body("Failed to create customer/staff");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating customer/staff: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody CustomerStaffDTO dto) {
        try {
            Optional<CustomerStaff> updatedCustomerStaff = service.update(dto.getSchoolId(), id, dto);
            if (updatedCustomerStaff.isPresent()) {
                return ResponseEntity.ok(updatedCustomerStaff.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating customer/staff: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, @RequestParam String schoolId) {
        try {
            boolean deleted = service.delete(schoolId, id);
            if (deleted) {
                return ResponseEntity.ok("Deleted successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting customer/staff: " + e.getMessage());
        }
    }
}