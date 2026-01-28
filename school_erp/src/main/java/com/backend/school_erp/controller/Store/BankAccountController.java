package com.backend.school_erp.controller.Store;

import com.backend.school_erp.DTO.Store.BankAccountDTO;
import com.backend.school_erp.entity.Store.BankAccount;
import com.backend.school_erp.service.Store.BankAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/store/bank-accounts")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowedHeaders = "*", allowCredentials = "true")
public class BankAccountController {

    private final BankAccountService service;

    @GetMapping
    public ResponseEntity<List<BankAccount>> getAll(@RequestParam String schoolId) {
        return ResponseEntity.ok(service.getAllAccounts(schoolId));
    }

    @PostMapping("/save")
    public ResponseEntity<?> save(@RequestParam String schoolId, @RequestBody BankAccountDTO dto) {
        try {
            service.saveAccount(schoolId, dto);
            return ResponseEntity.ok(Map.of("message", "Bank Account Saved Successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> update(@RequestParam String schoolId, @PathVariable Long id, @RequestBody BankAccountDTO dto) {
        try {
            service.updateAccount(schoolId, id, dto);
            return ResponseEntity.ok(Map.of("message", "Bank Account Updated Successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@RequestParam String schoolId, @PathVariable Long id) {
        service.deleteAccount(schoolId, id);
        return ResponseEntity.ok(Map.of("message", "Deleted Successfully"));
    }
}