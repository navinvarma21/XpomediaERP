package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.StateDistrictDTO;
import com.backend.school_erp.entity.Administration.StateDistrict;
import com.backend.school_erp.service.Administration.StateDistrictService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/administration/statedistrict")
@RequiredArgsConstructor
public class StateDistrictController {

    private final StateDistrictService service;

    @GetMapping("/{type}/{schoolId}")
    public ResponseEntity<List<StateDistrict>> getAll(
            @PathVariable String type,
            @PathVariable String schoolId) {
        return ResponseEntity.ok(service.getAll(type, schoolId));
    }

    @PostMapping("/add")
    public ResponseEntity<?> add(@RequestBody Map<String, Object> body) {
        try {
            StateDistrictDTO dto = StateDistrictDTO.builder()
                    .name((String) body.get("name"))
                    .type((String) body.get("type"))
                    .stateId(body.get("stateId") != null ? Long.valueOf(body.get("stateId").toString()) : null)
                    .schoolId((String) body.get("schoolId"))
                    .build();

            return ResponseEntity.ok(service.add(dto.getSchoolId(), dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            String schoolId = (String) body.get("schoolId");
            String newName = (String) body.get("name");

            return service.update(schoolId, id, newName)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.badRequest().body("Entry not found or update failed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> delete(
            @PathVariable Long id,
            @RequestParam String schoolId) {
        boolean deleted = service.delete(schoolId, id);
        return deleted ? ResponseEntity.ok("Deleted successfully (including related districts if state)")
                : ResponseEntity.badRequest().body("Delete failed");
    }

    @GetMapping("/districts/{schoolId}/{stateId}")
    public ResponseEntity<List<StateDistrict>> getDistrictsByState(
            @PathVariable String schoolId,
            @PathVariable Long stateId) {
        return ResponseEntity.ok(service.getDistrictsByState(schoolId, stateId));
    }
}
