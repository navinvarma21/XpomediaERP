package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.ItemDTO;
import com.backend.school_erp.entity.Store.Item;
import com.backend.school_erp.service.Store.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/store/items")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ItemController {
    private final ItemService service;

    @GetMapping
    public ResponseEntity<List<Item>> getItems(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(service.getItems(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<Item> createItem(
            @RequestParam String schoolId,
            @RequestParam String year,
            @RequestBody ItemDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.addItem(schoolId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Item> updateItem(
            @RequestParam String schoolId,
            @RequestParam String year,
            @PathVariable Long id,
            @RequestBody ItemDTO dto
    ) {
        dto.setAcademicYear(year);
        return ResponseEntity.ok(service.updateItem(schoolId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(
            @RequestParam String schoolId,
            @PathVariable Long id
    ) {
        service.deleteItem(schoolId, id);
        return ResponseEntity.noContent().build();
    }
}