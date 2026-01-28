package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.ItemGroupDTO;
import com.backend.school_erp.entity.Store.ItemGroup;
import com.backend.school_erp.service.Store.ItemGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/store/groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ItemGroupController {
    private final ItemGroupService service;

    @GetMapping
    public ResponseEntity<List<ItemGroup>> getGroups(@RequestParam String schoolId, @RequestParam String year) {
        return ResponseEntity.ok(service.getGroups(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<ItemGroup> createGroup(@RequestParam String schoolId, @RequestParam String year, @RequestBody ItemGroupDTO dto) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.addGroup(schoolId, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@RequestParam String schoolId, @PathVariable Long id) {
        service.deleteGroup(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}