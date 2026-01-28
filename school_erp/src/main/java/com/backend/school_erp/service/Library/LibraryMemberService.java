package com.backend.school_erp.service.Library;

import com.backend.school_erp.DTO.Library.LibraryMemberDTO;
import com.backend.school_erp.entity.Library.LibraryMember;
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
public class LibraryMemberService {

    private final LibraryMemberRepository libraryMemberRepository;

    public LibraryMemberDTO addLibraryMember(String schoolId, LibraryMemberDTO dto) {
        // Check if student is already a library member
        if (libraryMemberRepository.existsByAdmissionNumber(dto.getAdmissionNumber(), schoolId, dto.getAcademicYear())) {
            throw new RuntimeException("Student is already a library member: " + dto.getAdmissionNumber());
        }

        // Generate clean membership ID
        String membershipId = generateMembershipId(dto.getAdmissionNumber());

        LibraryMember member = LibraryMember.builder()
                .admissionNumber(dto.getAdmissionNumber())
                .studentName(dto.getStudentName())
                .standard(dto.getStandard())
                .section(dto.getSection())
                .fatherName(dto.getFatherName())
                .phoneNumber(dto.getPhoneNumber())
                .email(dto.getEmail())
                .membershipId(membershipId)
                .membershipStartDate(dto.getMembershipStartDate())
                .membershipEndDate(dto.getMembershipEndDate())
                .membershipStatus("ACTIVE")
                .maxBooksAllowed(dto.getMaxBooksAllowed() != null ? dto.getMaxBooksAllowed() : 3)
                .academicYear(dto.getAcademicYear())
                .build();

        LibraryMember savedMember = libraryMemberRepository.save(member, schoolId);
        return convertToDTO(savedMember);
    }

    public List<LibraryMemberDTO> getAllLibraryMembers(String schoolId, String academicYear) {
        List<LibraryMember> members = libraryMemberRepository.findBySchoolIdAndAcademicYear(schoolId, academicYear);
        return members.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public LibraryMemberDTO getLibraryMemberById(String schoolId, Long id) {
        LibraryMember member = libraryMemberRepository.findById(id, schoolId)
                .orElseThrow(() -> new RuntimeException("Library member not found with id: " + id));
        return convertToDTO(member);
    }

    public LibraryMemberDTO getLibraryMemberByAdmissionNumber(String schoolId, String admissionNumber, String academicYear) {
        LibraryMember member = libraryMemberRepository.findByAdmissionNumber(admissionNumber, schoolId, academicYear)
                .orElseThrow(() -> new RuntimeException("Library member not found with admission number: " + admissionNumber));
        return convertToDTO(member);
    }

    public LibraryMemberDTO updateLibraryMember(String schoolId, Long id, LibraryMemberDTO dto) {
        LibraryMember existingMember = libraryMemberRepository.findById(id, schoolId)
                .orElseThrow(() -> new RuntimeException("Library member not found with id: " + id));

        LibraryMember member = LibraryMember.builder()
                .id(id)
                .admissionNumber(existingMember.getAdmissionNumber()) // Cannot change admission number
                .studentName(dto.getStudentName())
                .standard(dto.getStandard())
                .section(dto.getSection())
                .fatherName(dto.getFatherName())
                .phoneNumber(dto.getPhoneNumber())
                .email(dto.getEmail())
                .membershipId(existingMember.getMembershipId()) // Cannot change membership ID
                .membershipStartDate(dto.getMembershipStartDate())
                .membershipEndDate(dto.getMembershipEndDate())
                .membershipStatus(dto.getMembershipStatus())
                .maxBooksAllowed(dto.getMaxBooksAllowed())
                .academicYear(dto.getAcademicYear())
                .build();

        LibraryMember updatedMember = libraryMemberRepository.update(member, schoolId);
        return convertToDTO(updatedMember);
    }

    public void deleteLibraryMember(String schoolId, Long id) {
        libraryMemberRepository.delete(id, schoolId);
    }

    public List<LibraryMemberDTO> getExpiringMembers(String schoolId, int daysBeforeExpiry) {
        List<LibraryMember> members = libraryMemberRepository.findExpiringMembers(daysBeforeExpiry, schoolId);
        return members.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<LibraryMemberDTO> getExpiredMembers(String schoolId) {
        List<LibraryMember> members = libraryMemberRepository.findExpiredMembers(schoolId);
        return members.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void checkAndUpdateExpiredMembers(String schoolId) {
        libraryMemberRepository.updateMembershipStatus(schoolId);
    }

    public LibraryMemberDTO renewMembership(String schoolId, Long id, LocalDate newEndDate) {
        LibraryMember existingMember = libraryMemberRepository.findById(id, schoolId)
                .orElseThrow(() -> new RuntimeException("Library member not found with id: " + id));

        LibraryMember member = LibraryMember.builder()
                .id(id)
                .admissionNumber(existingMember.getAdmissionNumber())
                .studentName(existingMember.getStudentName())
                .standard(existingMember.getStandard())
                .section(existingMember.getSection())
                .fatherName(existingMember.getFatherName())
                .phoneNumber(existingMember.getPhoneNumber())
                .email(existingMember.getEmail())
                .membershipId(existingMember.getMembershipId())
                .membershipStartDate(LocalDate.now())
                .membershipEndDate(newEndDate)
                .membershipStatus("ACTIVE")
                .maxBooksAllowed(existingMember.getMaxBooksAllowed())
                .academicYear(existingMember.getAcademicYear())
                .build();

        LibraryMember updatedMember = libraryMemberRepository.update(member, schoolId);
        return convertToDTO(updatedMember);
    }

    private String generateMembershipId(String admissionNumber) {
        // Clean and simple membership ID: MEM-year-admissionNumber
        String year = String.valueOf(java.time.Year.now().getValue()).substring(2);
        return "MEM-" + year + "-" + admissionNumber;
    }

    private LibraryMemberDTO convertToDTO(LibraryMember member) {
        boolean isExpired = member.getMembershipEndDate().isBefore(LocalDate.now());
        long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), member.getMembershipEndDate());

        return LibraryMemberDTO.builder()
                .id(member.getId())
                .admissionNumber(member.getAdmissionNumber())
                .studentName(member.getStudentName())
                .standard(member.getStandard())
                .section(member.getSection())
                .fatherName(member.getFatherName())
                .phoneNumber(member.getPhoneNumber())
                .email(member.getEmail())
                .membershipId(member.getMembershipId())
                .membershipStartDate(member.getMembershipStartDate())
                .membershipEndDate(member.getMembershipEndDate())
                .membershipStatus(isExpired ? "EXPIRED" : member.getMembershipStatus())
                .maxBooksAllowed(member.getMaxBooksAllowed())
                .academicYear(member.getAcademicYear())
                .isExpired(isExpired)
                .daysUntilExpiry(daysUntilExpiry > 0 ? daysUntilExpiry : 0)
                .issuedBooksCount(0) // You can integrate with book issue service later
                .build();
    }
}