package com.backend.school_erp.controller.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.EnquiryDropdownDTO;
import com.backend.school_erp.DTO.AdmissionMaster.FeeDetailDTO;
import com.backend.school_erp.service.AdmissionMaster.EnquiryDropdownService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admissionmaster/amdropdowns")
@RequiredArgsConstructor
public class EnquiryDropdownController {

    private final EnquiryDropdownService dropdownService;

    @GetMapping("/nationalities")
    public List<EnquiryDropdownDTO> getNationalities(@RequestParam String schoolId, @RequestParam(required = false) String academicYear) {
        return dropdownService.getNationalities(schoolId, academicYear);
    }

    @GetMapping("/religions")
    public List<EnquiryDropdownDTO> getReligions(@RequestParam String schoolId, @RequestParam(required = false) String academicYear) {
        return dropdownService.getReligions(schoolId, academicYear);
    }

    @GetMapping("/communities")
    public List<EnquiryDropdownDTO> getCommunities(@RequestParam String schoolId, @RequestParam(required = false) String academicYear) {
        return dropdownService.getCommunities(schoolId, academicYear);
    }

    @GetMapping("/castes")
    public List<EnquiryDropdownDTO> getCastes(@RequestParam String schoolId, @RequestParam(required = false) String academicYear) {
        return dropdownService.getCastes(schoolId, academicYear);
    }

    @GetMapping("/districts")
    public List<EnquiryDropdownDTO> getDistricts(@RequestParam String schoolId) {
        return dropdownService.getDistricts(schoolId);
    }

    @GetMapping("/districts/bystate")
    public List<EnquiryDropdownDTO> getDistrictsByState(
            @RequestParam String schoolId,
            @RequestParam Long stateId) {
        return dropdownService.getDistrictsByState(schoolId, stateId);
    }

    @GetMapping("/states")
    public List<EnquiryDropdownDTO> getStates(@RequestParam String schoolId) {
        return dropdownService.getStates(schoolId);
    }

    @GetMapping("/sections")
    public List<EnquiryDropdownDTO> getSections(@RequestParam String schoolId, @RequestParam(required = false) String academicYear) {
        return dropdownService.getSections(schoolId, academicYear);
    }

    @GetMapping("/mothertongues")
    public List<EnquiryDropdownDTO> getMotherTongues(@RequestParam String schoolId, @RequestParam(required = false) String academicYear) {
        return dropdownService.getMotherTongues(schoolId, academicYear);
    }

    @GetMapping("/studentcategories")
    public List<EnquiryDropdownDTO> getStudentCategories(@RequestParam String schoolId, @RequestParam(required = false) String academicYear) {
        return dropdownService.getStudentCategories(schoolId, academicYear);
    }

    @GetMapping("/courses")
    public List<EnquiryDropdownDTO> getCourses(@RequestParam String schoolId, @RequestParam(required = false) String academicYear) {
        return dropdownService.getCourses(schoolId, academicYear);
    }

    @GetMapping("/parentoccupations")
    public List<EnquiryDropdownDTO> getParentOccupations(@RequestParam String schoolId, @RequestParam(required = false) String academicYear) {
        return dropdownService.getParentOccupations(schoolId, academicYear);
    }

    @GetMapping("/bloodgroups")
    public List<EnquiryDropdownDTO> getBloodGroups(@RequestParam String schoolId, @RequestParam(required = false) String academicYear) {
        return dropdownService.getBloodGroups(schoolId, academicYear);
    }

    @GetMapping("/busfees")
    public List<EnquiryDropdownDTO> getBusFees(@RequestParam String schoolId, @RequestParam(required = false) String academicYear) {
        return dropdownService.getBusFees(schoolId, academicYear);
    }

    @GetMapping("/hostelfeeheads")
    public List<EnquiryDropdownDTO> getHostelFeeHeads(@RequestParam String schoolId, @RequestParam(required = false) String academicYear) {
        return dropdownService.getHostelFeeHeads(schoolId, academicYear);
    }

    @GetMapping("/allfees")
    public List<FeeDetailDTO> getAllFees(
            @RequestParam String schoolId,
            @RequestParam String standard,
            @RequestParam String studentCategory,
            @RequestParam(required = false) String academicYear) {
        return dropdownService.getAllFees(schoolId, standard, studentCategory, academicYear);
    }

    @GetMapping("/hostelfees")
    public List<FeeDetailDTO> getHostelFees(
            @RequestParam String schoolId,
            @RequestParam String standard,
            @RequestParam String studentCategory,
            @RequestParam(required = false) String academicYear) {
        return dropdownService.getHostelFees(schoolId, standard, studentCategory, academicYear);
    }

    @GetMapping("/busfee")
    public FeeDetailDTO getBusFee(
            @RequestParam String schoolId,
            @RequestParam String boardingPoint,
            @RequestParam String routeNumber,
            @RequestParam(required = false) String academicYear) {
        return dropdownService.getBusFee(schoolId, boardingPoint, routeNumber, academicYear);
    }
}