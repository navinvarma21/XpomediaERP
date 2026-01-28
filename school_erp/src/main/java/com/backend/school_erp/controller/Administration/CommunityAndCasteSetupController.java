package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.CommunityAndCasteSetupDTO;
import com.backend.school_erp.entity.Administration.CommunityAndCasteSetup;
import com.backend.school_erp.service.Administration.CommunityAndCasteSetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administration/communityandcastesetup")
@RequiredArgsConstructor
public class CommunityAndCasteSetupController {

    private final CommunityAndCasteSetupService service;

    @PostMapping("/ensure")
    public String ensureTenant(@RequestParam String schoolId) {
        service.ensureTenant(schoolId);
        return "Tenant structures ensured for schoolId: " + schoolId;
    }

    @GetMapping("/{type}")
    public List<CommunityAndCasteSetup> getAll(
            @PathVariable String type,
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        return service.getAll(schoolId, academicYear, type);
    }

    @PostMapping("/{type}")
    public CommunityAndCasteSetup add(
            @PathVariable String type,
            @RequestBody CommunityAndCasteSetupDTO dto
    ) {
        dto.setType(type);
        return service.add(dto);
    }

    @PutMapping("/{type}/{id}")
    public CommunityAndCasteSetup update(
            @PathVariable String type,
            @PathVariable Long id,
            @RequestBody CommunityAndCasteSetupDTO dto
    ) {
        return service.update(dto.getSchoolId(), id, dto.getName())
                .orElseThrow(() -> new RuntimeException(type + " entry not found"));
    }

    @DeleteMapping("/{type}/{id}")
    public String delete(
            @PathVariable String type,
            @PathVariable Long id,
            @RequestParam String schoolId
    ) {
        boolean deleted = service.delete(schoolId, id);
        return deleted ? "Deleted successfully" : type + " entry not found";
    }
}
