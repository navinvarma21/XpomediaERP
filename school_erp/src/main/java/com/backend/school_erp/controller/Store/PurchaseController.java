package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.PurchaseTransactionDTO;
import com.backend.school_erp.service.Store.PurchaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/store/purchase")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PurchaseController {

    private final PurchaseService service;

    @PostMapping("/save")
    public ResponseEntity<?> savePurchase(@RequestBody PurchaseTransactionDTO dto) {
        try {
            service.savePurchase(dto);
            return ResponseEntity.ok("Purchase Saved Successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    @GetMapping("/stock/{itemCode}")
    public ResponseEntity<Integer> getStock(
            @RequestParam String schoolId,
            @PathVariable String itemCode) {
        return ResponseEntity.ok(service.getCurrentStock(schoolId, itemCode));
    }

    @GetMapping("/next-entry-no")
    public ResponseEntity<String> getNextEntryNo(@RequestParam String schoolId) {
        return ResponseEntity.ok(service.generateEntryNumber(schoolId));
    }
}