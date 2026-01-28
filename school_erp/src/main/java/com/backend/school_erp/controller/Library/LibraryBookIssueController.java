package com.backend.school_erp.controller.Library;

import com.backend.school_erp.DTO.Library.LibraryBookIssueDTO;
import com.backend.school_erp.service.Library.LibraryBookIssueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/library/issues")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Slf4j
public class LibraryBookIssueController {

    private final LibraryBookIssueService libraryBookIssueService;

    @PostMapping
    public ResponseEntity<LibraryBookIssueDTO> issueBook(
            @RequestParam("schoolId") String schoolId,
            @RequestBody LibraryBookIssueDTO issueDTO
    ) {
        try {
            LibraryBookIssueDTO createdIssue = libraryBookIssueService.issueBook(schoolId, issueDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdIssue);
        } catch (Exception e) {
            log.error("Failed to issue book: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<LibraryBookIssueDTO> returnBook(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId
    ) {
        try {
            LibraryBookIssueDTO returnedIssue = libraryBookIssueService.returnBook(schoolId, id);
            return ResponseEntity.ok(returnedIssue);
        } catch (RuntimeException e) {
            log.error("Failed to return book: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to return book: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<LibraryBookIssueDTO>> getAllIssues(
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear
    ) {
        try {
            List<LibraryBookIssueDTO> issues = libraryBookIssueService.getAllIssues(schoolId, academicYear);
            return ResponseEntity.ok(issues);
        } catch (Exception e) {
            log.error("Failed to fetch book issues: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/issued")
    public ResponseEntity<List<LibraryBookIssueDTO>> getIssuedBooks(
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear
    ) {
        try {
            List<LibraryBookIssueDTO> issues = libraryBookIssueService.getIssuedBooks(schoolId, academicYear);
            return ResponseEntity.ok(issues);
        } catch (Exception e) {
            log.error("Failed to fetch issued books: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<LibraryBookIssueDTO>> getOverdueBooks(
            @RequestParam("schoolId") String schoolId
    ) {
        try {
            List<LibraryBookIssueDTO> issues = libraryBookIssueService.getOverdueBooks(schoolId);
            return ResponseEntity.ok(issues);
        } catch (Exception e) {
            log.error("Failed to fetch overdue books: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/member/{admissionNumber}")
    public ResponseEntity<List<LibraryBookIssueDTO>> getMemberIssues(
            @PathVariable String admissionNumber,
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear
    ) {
        try {
            List<LibraryBookIssueDTO> issues = libraryBookIssueService.getMemberIssues(admissionNumber, schoolId, academicYear);
            return ResponseEntity.ok(issues);
        } catch (Exception e) {
            log.error("Failed to fetch member issues: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/check-overdue")
    public ResponseEntity<Void> checkAndUpdateOverdueBooks(
            @RequestParam("schoolId") String schoolId
    ) {
        try {
            libraryBookIssueService.updateOverdueStatus(schoolId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to check overdue books: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}