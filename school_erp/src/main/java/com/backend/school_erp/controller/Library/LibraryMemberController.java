package com.backend.school_erp.controller.Library;

import com.backend.school_erp.DTO.Library.LibraryMemberDTO;
import com.backend.school_erp.service.Library.LibraryMemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/library/members")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Slf4j
public class LibraryMemberController {

    private final LibraryMemberService libraryMemberService;

    @PostMapping
    public ResponseEntity<LibraryMemberDTO> addLibraryMember(
            @RequestParam("schoolId") String schoolId,
            @RequestBody LibraryMemberDTO memberDTO
    ) {
        try {
            LibraryMemberDTO createdMember = libraryMemberService.addLibraryMember(schoolId, memberDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdMember);
        } catch (Exception e) {
            log.error("Failed to add library member: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<LibraryMemberDTO>> getAllLibraryMembers(
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear
    ) {
        try {
            List<LibraryMemberDTO> members = libraryMemberService.getAllLibraryMembers(schoolId, academicYear);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            log.error("Failed to fetch library members: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<LibraryMemberDTO> getLibraryMemberById(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId
    ) {
        try {
            LibraryMemberDTO member = libraryMemberService.getLibraryMemberById(schoolId, id);
            return ResponseEntity.ok(member);
        } catch (RuntimeException e) {
            log.error("Library member not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to fetch library member: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/admission/{admissionNumber}")
    public ResponseEntity<LibraryMemberDTO> getLibraryMemberByAdmissionNumber(
            @PathVariable String admissionNumber,
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear
    ) {
        try {
            LibraryMemberDTO member = libraryMemberService.getLibraryMemberByAdmissionNumber(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(member);
        } catch (RuntimeException e) {
            log.error("Library member not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to fetch library member: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<LibraryMemberDTO> updateLibraryMember(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId,
            @RequestBody LibraryMemberDTO memberDTO
    ) {
        try {
            LibraryMemberDTO updatedMember = libraryMemberService.updateLibraryMember(schoolId, id, memberDTO);
            return ResponseEntity.ok(updatedMember);
        } catch (RuntimeException e) {
            log.error("Failed to update library member: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to update library member: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLibraryMember(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId
    ) {
        try {
            libraryMemberService.deleteLibraryMember(schoolId, id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Failed to delete library member: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to delete library member: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/expiring")
    public ResponseEntity<List<LibraryMemberDTO>> getExpiringMembers(
            @RequestParam("schoolId") String schoolId,
            @RequestParam(value = "days", defaultValue = "7") int daysBeforeExpiry
    ) {
        try {
            List<LibraryMemberDTO> members = libraryMemberService.getExpiringMembers(schoolId, daysBeforeExpiry);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            log.error("Failed to fetch expiring members: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/expired")
    public ResponseEntity<List<LibraryMemberDTO>> getExpiredMembers(
            @RequestParam("schoolId") String schoolId
    ) {
        try {
            List<LibraryMemberDTO> members = libraryMemberService.getExpiredMembers(schoolId);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            log.error("Failed to fetch expired members: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<LibraryMemberDTO> renewMembership(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            LibraryMemberDTO renewedMember = libraryMemberService.renewMembership(schoolId, id, endDate);
            return ResponseEntity.ok(renewedMember);
        } catch (RuntimeException e) {
            log.error("Failed to renew membership: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to renew membership: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/check-expiry")
    public ResponseEntity<Void> checkAndUpdateExpiredMembers(
            @RequestParam("schoolId") String schoolId
    ) {
        try {
            libraryMemberService.checkAndUpdateExpiredMembers(schoolId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to check expiry: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}