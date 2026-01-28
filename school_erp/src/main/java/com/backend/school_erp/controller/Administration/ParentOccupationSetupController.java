package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.ParentOccupationSetupDTO;
import com.backend.school_erp.entity.Administration.ParentOccupationSetup;
import com.backend.school_erp.service.Administration.ParentOccupationSetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/administration/parentoccu")
@RequiredArgsConstructor
public class ParentOccupationSetupController {

    private final ParentOccupationSetupService service;

    @PostMapping("/getAll")
    public List<ParentOccupationSetup> getAll(@RequestBody Map<String, String> req) {
        String schoolId = req.get("schoolId");
        String academicYear = req.get("academicYear");
        return service.getAll(schoolId, academicYear);
    }

    @PostMapping("/add")
    public ParentOccupationSetup add(@RequestBody Map<String, String> req) {
        String schoolId = req.get("schoolId");
        String academicYear = req.get("academicYear");
        String occupation = req.get("occupation");

        ParentOccupationSetupDTO dto = new ParentOccupationSetupDTO();
        dto.setOccupation(occupation);
        dto.setAcademicYear(academicYear);

        return service.addOccupation(schoolId, dto);
    }

    @PutMapping("/update")
    public ParentOccupationSetup update(@RequestBody Map<String, String> req) {
        String schoolId = req.get("schoolId");
        Long id = Long.parseLong(req.get("id"));
        String occupation = req.get("occupation");
        return service.updateOccupation(schoolId, id, occupation);
    }

    @DeleteMapping("/delete")
    public void delete(@RequestBody Map<String, String> req) {
        String schoolId = req.get("schoolId");
        Long id = Long.parseLong(req.get("id"));
        service.deleteOccupation(schoolId, id);
    }
}
