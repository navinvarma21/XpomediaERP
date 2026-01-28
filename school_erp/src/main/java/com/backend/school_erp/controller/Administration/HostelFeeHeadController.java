package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.HostelFeeHeadDTO;
import com.backend.school_erp.entity.Administration.HostelFeeHead;
import com.backend.school_erp.service.Administration.HostelFeeHeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administration/hosfeeset")
@RequiredArgsConstructor
public class HostelFeeHeadController {

    private final HostelFeeHeadService service;

    @GetMapping("/list")
    public List<HostelFeeHead> listFeeHeads(
            @RequestParam String schoolId,
            @RequestParam String year) {
        return service.getFeeHeads(schoolId, year);
    }

    @PostMapping("/create")
    public HostelFeeHead createFeeHead(@RequestBody HostelFeeHeadDTO dto) {
        return service.addFeeHead(dto.getSchoolId(), dto);
    }

    @PutMapping("/update/{id}")
    public HostelFeeHead updateFeeHead(@PathVariable Long id, @RequestBody HostelFeeHeadDTO dto) {
        return service.updateFeeHead(dto.getSchoolId(), id, dto);
    }

    @DeleteMapping("/delete/{id}")
    public void deleteFeeHead(
            @PathVariable Long id,
            @RequestParam String schoolId,
            @RequestParam String year) {
        service.deleteFeeHead(schoolId, id, year);
    }
}
