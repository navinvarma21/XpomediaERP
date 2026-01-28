package com.backend.school_erp.service.Library;

import com.backend.school_erp.DTO.Library.LibraryBookIssueDTO;
import com.backend.school_erp.entity.Library.LibraryBookIssue;
import com.backend.school_erp.repository.Library.LibraryBookIssueRepository;
import com.backend.school_erp.repository.Library.LibraryMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LibraryBookIssueService {

    private final LibraryBookIssueRepository libraryBookIssueRepository;
    private final LibraryMemberRepository libraryMemberRepository;
    private final BookDetailService bookDetailService;

    public LibraryBookIssueDTO issueBook(String schoolId, LibraryBookIssueDTO dto) {
        log.info("Issuing book for school: {}, member: {}, book: {}", schoolId, dto.getAdmissionNumber(), dto.getBookId());

        // Check if member exists and is active
        if (!libraryMemberRepository.existsByAdmissionNumber(dto.getAdmissionNumber(), schoolId, dto.getAcademicYear())) {
            throw new RuntimeException("Student is not a library member: " + dto.getAdmissionNumber());
        }

        // Check if book is already issued
        if (libraryBookIssueRepository.isBookIssued(dto.getBookId(), schoolId, dto.getAcademicYear())) {
            throw new RuntimeException("Book is already issued to another member: " + dto.getBookId());
        }

        // Check member's issued book count (max 3 books)
        int issuedBooksCount = libraryBookIssueRepository.countIssuedBooksByMember(dto.getAdmissionNumber(), schoolId, dto.getAcademicYear());
        if (issuedBooksCount >= 3) {
            throw new RuntimeException("Member has reached maximum book limit (3 books)");
        }

        // Update book available copies - DECREASE
        try {
            bookDetailService.decreaseAvailableCopies(schoolId, dto.getBookId());
            log.info("Decreased available copies for book: {}", dto.getBookId());
        } catch (Exception e) {
            throw new RuntimeException("Failed to update book availability: " + e.getMessage());
        }

        LibraryBookIssue issue = LibraryBookIssue.builder()
                .admissionNumber(dto.getAdmissionNumber())
                .studentName(dto.getStudentName())
                .standard(dto.getStandard())
                .section(dto.getSection())
                .membershipId(dto.getMembershipId())
                .bookId(dto.getBookId())
                .bookTitle(dto.getBookTitle())
                .authorName(dto.getAuthorName())
                .isbn(dto.getIsbn())
                .issuedDate(dto.getIssuedDate())
                .dueDate(dto.getDueDate())
                .status("ISSUED")
                .fineAmount(0.0)
                .remarks("Book issued to " + dto.getStudentName())
                .academicYear(dto.getAcademicYear())
                .build();

        LibraryBookIssue savedIssue = libraryBookIssueRepository.save(issue, schoolId);
        log.info("Book issue record saved with ID: {}", savedIssue.getId());

        return convertToDTO(savedIssue);
    }

    public LibraryBookIssueDTO returnBook(String schoolId, Long issueId) {
        log.info("Returning book for school: {}, issue ID: {}", schoolId, issueId);

        LibraryBookIssue issue = libraryBookIssueRepository.findById(issueId, schoolId)
                .orElseThrow(() -> new RuntimeException("Book issue record not found with id: " + issueId));

        if ("RETURNED".equals(issue.getStatus())) {
            throw new RuntimeException("Book is already returned");
        }

        // Calculate fine if overdue
        double fineAmount = 0.0;
        String remarks = "Book returned successfully";

        if (LocalDate.now().isAfter(issue.getDueDate())) {
            long daysOverdue = ChronoUnit.DAYS.between(issue.getDueDate(), LocalDate.now());
            fineAmount = daysOverdue * 5.0; // ₹5 per day fine
            remarks = "Book returned " + daysOverdue + " days overdue. Fine: ₹" + fineAmount;
            log.info("Overdue book - Days: {}, Fine: {}", daysOverdue, fineAmount);
        }

        // Update book available copies - INCREASE
        try {
            bookDetailService.increaseAvailableCopies(schoolId, issue.getBookId());
            log.info("Increased available copies for book: {}", issue.getBookId());
        } catch (Exception e) {
            throw new RuntimeException("Failed to update book availability: " + e.getMessage());
        }

        // Update book issue record
        issue.setReturnedDate(LocalDate.now());
        issue.setStatus("RETURNED");
        issue.setFineAmount(fineAmount);
        issue.setRemarks(remarks);

        LibraryBookIssue updatedIssue = libraryBookIssueRepository.update(issue, schoolId);
        log.info("Book return record updated for issue ID: {}", issueId);

        return convertToDTO(updatedIssue);
    }

    public List<LibraryBookIssueDTO> getAllIssues(String schoolId, String academicYear) {
        List<LibraryBookIssue> issues = libraryBookIssueRepository.findBySchoolIdAndAcademicYear(schoolId, academicYear);
        return issues.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<LibraryBookIssueDTO> getIssuedBooks(String schoolId, String academicYear) {
        List<LibraryBookIssue> issues = libraryBookIssueRepository.findIssuedBooks(schoolId, academicYear);
        return issues.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<LibraryBookIssueDTO> getOverdueBooks(String schoolId) {
        List<LibraryBookIssue> issues = libraryBookIssueRepository.findOverdueBooks(schoolId);
        return issues.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<LibraryBookIssueDTO> getMemberIssues(String admissionNumber, String schoolId, String academicYear) {
        List<LibraryBookIssue> issues = libraryBookIssueRepository.findByAdmissionNumber(admissionNumber, schoolId, academicYear);
        return issues.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void updateOverdueStatus(String schoolId) {
        libraryBookIssueRepository.updateOverdueStatus(schoolId);
    }

    private LibraryBookIssueDTO convertToDTO(LibraryBookIssue issue) {
        boolean isOverdue = "ISSUED".equals(issue.getStatus()) && LocalDate.now().isAfter(issue.getDueDate());
        long daysOverdue = isOverdue ? ChronoUnit.DAYS.between(issue.getDueDate(), LocalDate.now()) : 0;

        return LibraryBookIssueDTO.builder()
                .id(issue.getId())
                .admissionNumber(issue.getAdmissionNumber())
                .studentName(issue.getStudentName())
                .standard(issue.getStandard())
                .section(issue.getSection())
                .membershipId(issue.getMembershipId())
                .bookId(issue.getBookId())
                .bookTitle(issue.getBookTitle())
                .authorName(issue.getAuthorName())
                .isbn(issue.getIsbn())
                .issuedDate(issue.getIssuedDate())
                .dueDate(issue.getDueDate())
                .returnedDate(issue.getReturnedDate())
                .status(issue.getStatus())
                .fineAmount(issue.getFineAmount())
                .remarks(issue.getRemarks())
                .academicYear(issue.getAcademicYear())
                .isOverdue(isOverdue)
                .daysOverdue(daysOverdue)
                .build();
    }
}