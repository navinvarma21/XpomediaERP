package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.SFDropdownDTO;
import com.backend.school_erp.service.Administration.SFDropdownService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administration/staff-dropdowns")
@RequiredArgsConstructor
public class SFDropdownController {

    private final SFDropdownService dropdownService;

    @GetMapping("/states")
    public List<SFDropdownDTO> getStates(@RequestParam String schoolId,
                                         @RequestParam String academicYear) {
        return dropdownService.getStates(schoolId, academicYear);
    }

    @GetMapping("/districts")
    public List<SFDropdownDTO> getDistricts(@RequestParam String schoolId,
                                            @RequestParam String academicYear) {
        return dropdownService.getDistricts(schoolId, academicYear);
    }

    @GetMapping("/communities")
    public List<SFDropdownDTO> getCommunities(@RequestParam String schoolId,
                                              @RequestParam String academicYear) {
        return dropdownService.getCommunities(schoolId, academicYear);
    }

    @GetMapping("/castes")
    public List<SFDropdownDTO> getCastes(@RequestParam String schoolId,
                                         @RequestParam String academicYear) {
        return dropdownService.getCastes(schoolId, academicYear);
    }

    @GetMapping("/religions")
    public List<SFDropdownDTO> getReligions(@RequestParam String schoolId,
                                            @RequestParam String academicYear) {
        return dropdownService.getReligions(schoolId, academicYear);
    }

    @GetMapping("/nationalities")
    public List<SFDropdownDTO> getNationalities(@RequestParam String schoolId,
                                                @RequestParam String academicYear) {
        return dropdownService.getNationalities(schoolId, academicYear);
    }

    @GetMapping("/staff-designations")
    public List<SFDropdownDTO> getStaffDesignations(@RequestParam String schoolId,
                                                    @RequestParam String academicYear) {
        return dropdownService.getStaffDesignations(schoolId, academicYear);
    }

    @GetMapping("/staff-categories")
    public List<SFDropdownDTO> getStaffCategories(@RequestParam String schoolId,
                                                  @RequestParam String academicYear) {
        return dropdownService.getStaffCategories(schoolId, academicYear);
    }

    @GetMapping("/staff-courses")
    public List<SFDropdownDTO> getCourses(@RequestParam String schoolId,
                                          @RequestParam String academicYear) {
        return dropdownService.getCourses(schoolId, academicYear);
    }
}