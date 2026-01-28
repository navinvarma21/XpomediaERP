package com.backend.school_erp.service.Admin;

import com.backend.school_erp.entity.Admin.Schoollist;
import com.backend.school_erp.repository.Admin.SchoollistRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class SchoolsListService {

    private final SchoollistRepository schoollistRepository;
    private PasswordEncoder passwordEncoder;

    public SchoolsListService(SchoollistRepository schoollistRepository) {
        this.schoollistRepository = schoollistRepository;
    }

    @Bean
    @Lazy
    public PasswordEncoder passwordEncoder() {
        if (this.passwordEncoder == null) {
            this.passwordEncoder = new BCryptPasswordEncoder();
        }
        return this.passwordEncoder;
    }

    private PasswordEncoder getPasswordEncoder() {
        if (this.passwordEncoder == null) {
            this.passwordEncoder = passwordEncoder();
        }
        return this.passwordEncoder;
    }

    // ✅ Get all schools
    public List<Schoollist> getAllSchools() {
        List<Schoollist> schools = schoollistRepository.findAll();

        boolean hasChanges = false;
        for (Schoollist school : schools) {
            if (!school.getManualOverride() && shouldAutoUpdateStatus(school)) {
                String newStatus = calculateStatusBasedOnDates(school);
                if (!school.getStatus().equals(newStatus)) {
                    school.setStatus(newStatus);
                    hasChanges = true;
                }
            }
        }

        if (hasChanges) {
            schoollistRepository.saveAll(schools);
        }

        return schools;
    }

    // ✅ Get school by ID
    public Optional<Schoollist> getSchoolById(String schoolId) {
        Optional<Schoollist> schoolOpt = schoollistRepository.findById(schoolId);

        schoolOpt.ifPresent(school -> {
            if (!school.getManualOverride() && shouldAutoUpdateStatus(school)) {
                String newStatus = calculateStatusBasedOnDates(school);
                if (!school.getStatus().equals(newStatus)) {
                    school.setStatus(newStatus);
                    schoollistRepository.save(school);
                }
            }
        });

        return schoolOpt;
    }

    // ✅ Save new school
    public Schoollist saveSchool(Schoollist school) {
        // Validate uniqueness
        if (schoollistRepository.existsBySchoolName(school.getSchoolName())) {
            throw new RuntimeException("School name already exists: " + school.getSchoolName());
        }

        if (schoollistRepository.existsByEmail(school.getEmail())) {
            throw new RuntimeException("Email already exists: " + school.getEmail());
        }

        if (schoollistRepository.existsByPhone(school.getPhone())) {
            throw new RuntimeException("Phone number already exists: " + school.getPhone());
        }

        // ✅ Validate school code uniqueness
        if (schoollistRepository.existsBySchoolCode(school.getSchoolCode())) {
            throw new RuntimeException("School Code already exists: " + school.getSchoolCode());
        }

        // Validate school code format
        validateSchoolCode(school.getSchoolCode());

        if (school.getPassword() != null && !school.getPassword().isEmpty()) {
            school.setPassword(getPasswordEncoder().encode(school.getPassword()));
        }

        if (school.getStatus() == null) {
            school.setStatus(calculateStatusBasedOnDates(school));
        }

        if (school.getManualOverride() == null) {
            school.setManualOverride(false);
        }

        return schoollistRepository.save(school);
    }

    // ✅ Validate school code format
    private void validateSchoolCode(String schoolCode) {
        if (schoolCode == null || schoolCode.trim().isEmpty()) {
            throw new RuntimeException("School Code is required");
        }

        if (schoolCode.length() < 6 || schoolCode.length() > 10) {
            throw new RuntimeException("School Code must be between 6 and 10 characters");
        }

        if (!schoolCode.matches("^[A-Z0-9]+$")) {
            throw new RuntimeException("School Code must contain only uppercase letters and numbers");
        }
    }

    // ✅ Update school - FIXED: Reset manual override when dates are changed
    public Schoollist updateSchool(String schoolId, Schoollist updatedSchool) {
        return schoollistRepository.findById(schoolId).map(school -> {
            // Validate school name uniqueness
            if (!school.getSchoolName().equals(updatedSchool.getSchoolName()) &&
                    schoollistRepository.existsBySchoolName(updatedSchool.getSchoolName())) {
                throw new RuntimeException("School name already exists: " + updatedSchool.getSchoolName());
            }

            // Validate email uniqueness
            if (!school.getEmail().equals(updatedSchool.getEmail()) &&
                    schoollistRepository.existsByEmail(updatedSchool.getEmail())) {
                throw new RuntimeException("Email already exists: " + updatedSchool.getEmail());
            }

            // Validate phone uniqueness
            if (!school.getPhone().equals(updatedSchool.getPhone()) &&
                    schoollistRepository.existsByPhone(updatedSchool.getPhone())) {
                throw new RuntimeException("Phone number already exists: " + updatedSchool.getPhone());
            }

            // ✅ Validate school code uniqueness
            if (!school.getSchoolCode().equals(updatedSchool.getSchoolCode()) &&
                    schoollistRepository.existsBySchoolCode(updatedSchool.getSchoolCode())) {
                throw new RuntimeException("School Code already exists: " + updatedSchool.getSchoolCode());
            }

            // ✅ Validate school code format
            validateSchoolCode(updatedSchool.getSchoolCode());

            // Store original dates for comparison
            LocalDate originalFromDate = school.getFromDate();
            LocalDate originalToDate = school.getToDate();

            // Update fields
            school.setSchoolCode(updatedSchool.getSchoolCode()); // ✅ New field
            school.setSchoolName(updatedSchool.getSchoolName());
            school.setEmail(updatedSchool.getEmail());
            school.setPhone(updatedSchool.getPhone());
            school.setFromDate(updatedSchool.getFromDate());
            school.setToDate(updatedSchool.getToDate());

            // ✅ FIXED: Check if dates have changed
            boolean datesChanged = !school.getFromDate().equals(originalFromDate) ||
                    !school.getToDate().equals(originalToDate);

            // ✅ FIXED: Reset manual override when dates are changed
            if (datesChanged) {
                school.setManualOverride(false);
                String calculatedStatus = calculateStatusBasedOnDates(school);
                school.setStatus(calculatedStatus);
            } else {
                // Only respect manual override if dates haven't changed
                boolean isManualOverride = updatedSchool.getManualOverride() != null
                        ? updatedSchool.getManualOverride()
                        : school.getManualOverride();

                if (isManualOverride) {
                    school.setStatus(updatedSchool.getStatus());
                    school.setManualOverride(true);
                } else {
                    String calculatedStatus = calculateStatusBasedOnDates(school);
                    school.setStatus(calculatedStatus);
                    school.setManualOverride(false);
                }
            }

            if (updatedSchool.getPassword() != null && !updatedSchool.getPassword().isEmpty()) {
                school.setPassword(getPasswordEncoder().encode(updatedSchool.getPassword()));
            }

            return schoollistRepository.save(school);
        }).orElseThrow(() -> new RuntimeException("School not found with id: " + schoolId));
    }

    // ✅ Update school status only - FIXED: Proper manual override handling
    public Schoollist updateSchoolStatus(String schoolId, String status, Boolean manualOverride) {
        return schoollistRepository.findById(schoolId).map(school -> {
            System.out.println("Updating school status: " + schoolId + " to " + status + " with manualOverride: " + manualOverride);

            // ✅ FIXED: Always set manualOverride to true when admin manually toggles status
            // This ensures the toggle change persists in the database
            school.setStatus(status);
            school.setManualOverride(true); // Force manual override when admin toggles

            Schoollist savedSchool = schoollistRepository.save(school);
            System.out.println("School saved with status: " + savedSchool.getStatus() + " and manualOverride: " + savedSchool.getManualOverride());

            return savedSchool;
        }).orElseThrow(() -> new RuntimeException("School not found with id: " + schoolId));
    }

    private String calculateStatusBasedOnDates(Schoollist school) {
        if (school.getFromDate() == null || school.getToDate() == null) {
            return "Active";
        }

        LocalDate today = LocalDate.now();
        if (today.isBefore(school.getFromDate()) || today.isAfter(school.getToDate())) {
            return "InActive";
        } else {
            return "Active";
        }
    }

    private boolean shouldAutoUpdateStatus(Schoollist school) {
        if (school.getFromDate() == null || school.getToDate() == null) {
            return false;
        }

        String calculatedStatus = calculateStatusBasedOnDates(school);
        return !school.getStatus().equals(calculatedStatus);
    }

    public void deleteSchool(String schoolId) {
        if (!schoollistRepository.existsById(schoolId)) {
            throw new RuntimeException("School not found with id: " + schoolId);
        }

        schoollistRepository.deleteById(schoolId);

        String dbName = schoolId.replace("-", "_");
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/?useSSL=false&serverTimezone=UTC",
                "root",
                "MySQL@3306");
             Statement stmt = conn.createStatement()) {

            stmt.executeUpdate("DROP DATABASE IF EXISTS `" + dbName + "`");

        } catch (Exception e) {
            throw new RuntimeException("Failed to drop database for school: " + e.getMessage(), e);
        }
    }

    public boolean isManualOverride(String schoolId) {
        Optional<Schoollist> schoolOpt = schoollistRepository.findById(schoolId);
        return schoolOpt.map(Schoollist::getManualOverride).orElse(false);
    }

    public boolean existsBySchoolName(String schoolName) {
        return schoollistRepository.existsBySchoolName(schoolName);
    }

    public boolean existsByEmail(String email) {
        return schoollistRepository.existsByEmail(email);
    }

    public boolean existsByPhone(String phone) {
        return schoollistRepository.existsByPhone(phone);
    }

    // ✅ New method for school code existence check
    public boolean existsBySchoolCode(String schoolCode) {
        return schoollistRepository.existsBySchoolCode(schoolCode);
    }
}