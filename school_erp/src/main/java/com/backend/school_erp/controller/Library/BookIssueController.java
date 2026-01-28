package com.backend.school_erp.controller.Library;

import com.backend.school_erp.DTO.Library.BookIssueDTO;
import com.backend.school_erp.DTO.Library.MemberDTO;
import com.backend.school_erp.DTO.Library.MemberInfoDTO;
import com.backend.school_erp.entity.Library.LibraryIssueReturn;
import com.backend.school_erp.service.Library.BookIssueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/library/issue-return")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class BookIssueController {

    private final BookIssueService service;

    // Search Member Dropdown with better filtering
    @GetMapping("/search-members")
    public ResponseEntity<List<MemberDTO>> searchMembers(
            @RequestParam String term,
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(required = false) String memberType) {
        return ResponseEntity.ok(service.searchMembers(term, schoolId, academicYear, memberType));
    }

    // Get complete member info with borrowing history
    @GetMapping("/member-info")
    public ResponseEntity<?> getMemberInfo(
            @RequestParam String memberCode,
            @RequestParam String memberType,
            @RequestParam String schoolId,
            @RequestParam String academicYear) {
        try {
            MemberInfoDTO info = service.getMemberInfo(memberCode, memberType, schoolId, academicYear);
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Scan Book (For Issue) with availability check
    @GetMapping("/scan-book")
    public ResponseEntity<?> scanBook(
            @RequestParam String qrCode,
            @RequestParam String schoolId,
            @RequestParam(required = false) String memberCode) {
        try {
            Map<String, Object> result = service.scanBookForIssue(qrCode, schoolId, memberCode);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Scan Book (For Return) with fine calculation
    @GetMapping("/scan-return")
    public ResponseEntity<?> scanReturn(
            @RequestParam String qrCode,
            @RequestParam String schoolId) {
        try {
            Map<String, Object> result = service.scanBookForReturn(qrCode, schoolId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Validate before issuing
    @PostMapping("/validate-issue")
    public ResponseEntity<?> validateIssue(@RequestBody BookIssueDTO dto) {
        try {
            Map<String, Object> validation = service.validateIssue(dto);
            return ResponseEntity.ok(validation);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Issue Book Action
    @PostMapping("/issue")
    public ResponseEntity<?> issueBook(@RequestBody BookIssueDTO dto) {
        try {
            Map<String, Object> result = service.issueBook(dto);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Return Book Action with fine payment
    @PostMapping("/return")
    public ResponseEntity<?> returnBook(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = service.returnBook(
                    (String) payload.get("issueNo"),
                    (String) payload.get("schoolId"),
                    (Double) payload.getOrDefault("finePaid", 0.0),
                    (String) payload.getOrDefault("remarks", "")
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get member's borrowing history
    @GetMapping("/member-history")
    public ResponseEntity<?> getMemberHistory(
            @RequestParam String memberCode,
            @RequestParam String memberType,
            @RequestParam String schoolId,
            @RequestParam String academicYear,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<Map<String, Object>> history = service.getMemberBorrowingHistory(
                    memberCode, memberType, schoolId, academicYear, limit);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}