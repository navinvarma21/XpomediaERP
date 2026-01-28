package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.BloodGroupSetupDTO;
import com.backend.school_erp.entity.Administration.BloodGroupSetup;
import com.backend.school_erp.service.Administration.BloodGroupSetupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/administration/bloodgroups")
@RequiredArgsConstructor
@Slf4j
public class BloodGroupSetupController {

    private final BloodGroupSetupService bloodGroupSetupService;

    /** GET /bloodgroups?schoolId=&academicYear= */
    @GetMapping
    public ResponseEntity<List<BloodGroupSetup>> getBloodGroups(
            @RequestParam String schoolId,
            @RequestParam String academicYear  // ✅ FIXED: Changed from 'year' to 'academicYear'
    ) {
        log.info("Fetching blood groups for school: {}, academicYear: {}", schoolId, academicYear);
        return ResponseEntity.ok(bloodGroupSetupService.getBloodGroups(schoolId, academicYear));
    }

    /** POST /bloodgroups */
    @PostMapping
    public ResponseEntity<BloodGroupSetup> addBloodGroup(@RequestBody BloodGroupSetupDTO dto) {
        log.info("Adding blood group: {} for school: {}", dto.getBloodGroup(), dto.getSchoolId());
        BloodGroupSetup created = bloodGroupSetupService.addBloodGroup(dto.getSchoolId(), dto);
        return ResponseEntity.created(URI.create("/api/administration/bloodgroups/" + created.getId()))
                .body(created);
    }

    /** PUT /bloodgroups/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBloodGroup(
            @PathVariable Long id,
            @RequestBody BloodGroupSetupDTO dto) {
        log.info("Updating blood group ID: {} for school: {}", id, dto.getSchoolId());
        return bloodGroupSetupService.updateBloodGroup(dto.getSchoolId(), id, dto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** DELETE /bloodgroups/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBloodGroup(
            @PathVariable Long id,
            @RequestParam String schoolId) {
        log.info("Deleting blood group ID: {} for school: {}", id, schoolId);
        boolean deleted = bloodGroupSetupService.deleteBloodGroup(schoolId, id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}