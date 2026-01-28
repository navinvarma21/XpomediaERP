package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.MotherTongueSetupDTO;
import com.backend.school_erp.entity.Administration.MotherTongueSetup;
import com.backend.school_erp.service.Administration.MotherTongueSetupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/administration/mothertongues")
@RequiredArgsConstructor
@Slf4j
public class MotherTongueSetupController {

    private final MotherTongueSetupService motherTongueSetupService;

    /** GET /api/administration/mothertongues?schoolId=&year= */
    @GetMapping
    public ResponseEntity<List<MotherTongueSetup>> getMotherTongues(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        try {
            log.info("Fetching mother tongues for school: {}, year: {}", schoolId, year);
            List<MotherTongueSetup> motherTongues = motherTongueSetupService.getMotherTongues(schoolId, year);
            return ResponseEntity.ok(motherTongues);
        } catch (Exception e) {
            log.error("Error in getMotherTongues: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /** POST /api/administration/mothertongues */
    @PostMapping
    public ResponseEntity<?> addMotherTongue(@RequestBody MotherTongueSetupDTO dto) {
        try {
            log.info("Adding mother tongue for school: {}, name: {}", dto.getSchoolId(), dto.getMotherTongue());
            MotherTongueSetup created = motherTongueSetupService.addMotherTongue(dto.getSchoolId(), dto);
            return ResponseEntity
                    .created(URI.create("/api/administration/mothertongues/" + created.getId()))
                    .body(created);
        } catch (RuntimeException e) {
            log.error("Conflict in addMotherTongue: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error in addMotherTongue: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to add mother tongue");
        }
    }

    /** PUT /api/administration/mothertongues/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMotherTongue(
            @PathVariable Long id,
            @RequestBody MotherTongueSetupDTO dto
    ) {
        try {
            log.info("Updating mother tongue id: {}, school: {}, new name: {}", id, dto.getSchoolId(), dto.getMotherTongue());
            return motherTongueSetupService.updateMotherTongue(dto.getSchoolId(), id, dto)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (RuntimeException e) {
            log.error("Conflict in updateMotherTongue: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error in updateMotherTongue: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update mother tongue");
        }
    }

    /** DELETE /api/administration/mothertongues/{id}?schoolId= */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMotherTongue(
            @PathVariable Long id,
            @RequestParam String schoolId
    ) {
        try {
            log.info("Deleting mother tongue id: {}, school: {}", id, schoolId);
            boolean deleted = motherTongueSetupService.deleteMotherTongue(schoolId, id);
            return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error in deleteMotherTongue: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete mother tongue");
        }
    }
}
