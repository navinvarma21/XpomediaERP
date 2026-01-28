package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.StaffDACDTO;
import com.backend.school_erp.entity.Administration.StaffDAC;
import com.backend.school_erp.service.Administration.StaffDACService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/administration/staffdac")
@RequiredArgsConstructor
public class StaffDACController {

    private final StaffDACService service;

    @GetMapping("/{type}/{schoolId}/{academicYear}")
    public List<StaffDAC> getAll(
            @PathVariable String type,
            @PathVariable String schoolId,
            @PathVariable String academicYear) {
        return service.getAll(type, schoolId, academicYear);
    }

    @PostMapping("/add")
    public StaffDAC add(@RequestBody Map<String, Object> body) {
        StaffDACDTO dto = StaffDACDTO.builder()
                .name((String) body.get("name"))
                .type((String) body.get("type")) // 👈 must send from frontend
                .schoolId((String) body.get("schoolId"))
                .academicYear((String) body.get("academicYear"))
                .build();

        return service.add(dto.getSchoolId(), dto);
    }

    @PutMapping("/update/{id}")
    public StaffDAC update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String schoolId = (String) body.get("schoolId");
        String newName = (String) body.get("name");
        return service.update(schoolId, id, newName)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
    }

    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable Long id, @RequestParam String schoolId) {
        service.delete(schoolId, id);
    }
}
