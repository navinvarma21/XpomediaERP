package com.backend.school_erp.service.Admin;

import com.backend.school_erp.DTO.Admin.RegisterSchoolRequest;
import com.backend.school_erp.entity.Admin.School;
import com.backend.school_erp.repository.Admin.SchoolRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.time.LocalDate;

@Service
public class SchoolService {

    @Autowired
    private SchoolRepository schoolRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public School registerSchool(RegisterSchoolRequest request) {
        // ✅ Check uniqueness for all fields
        if (schoolRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }
        if (schoolRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new RuntimeException("Phone already registered");
        }
        if (schoolRepository.findBySchoolCode(request.getSchoolCode()).isPresent()) {
            throw new RuntimeException("School Code already exists");
        }

        // ✅ Validate school code
        validateSchoolCode(request.getSchoolCode());

        // ✅ Validate status
        String status = request.getStatus();
        if (status == null || status.trim().isEmpty()) {
            status = "Active"; // Default to Active if not provided
        } else if (!status.equals("Active") && !status.equals("InActive")) {
            throw new RuntimeException("Status must be either 'Active' or 'InActive'");
        }

        // ✅ Validate dates
        validateDates(request.getFromDate(), request.getToDate());

        // ✅ Save school in main DB
        School school = new School();
        school.setSchoolId(request.getSchoolId());
        school.setSchoolCode(request.getSchoolCode()); // ✅ Set school code
        school.setSchoolName(request.getSchoolName());
        school.setEmail(request.getEmail());
        school.setPhone(request.getPhone());
        school.setPassword(passwordEncoder.encode(request.getPassword()));
        school.setStatus(status);
        school.setFromDate(request.getFromDate());
        school.setToDate(request.getToDate());
        school.setManualOverride(false); // ✅ Set manual override to false by default

        School savedSchool = schoolRepository.save(school);

        // ✅ Create new database schema for this school
        String dbName = request.getSchoolId().replaceAll("[^a-z0-9_]", "_");

        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/?useSSL=false&serverTimezone=UTC",
                "root",
                "MySQL@3306");
             Statement stmt = conn.createStatement()) {

            stmt.executeUpdate("CREATE DATABASE IF NOT EXISTS `" + dbName + "`");

        } catch (Exception e) {
            throw new RuntimeException("Failed to create database for school: " + e.getMessage(), e);
        }

        return savedSchool;
    }

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

    private void validateDates(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null) {
            throw new RuntimeException("From date is required");
        }
        if (toDate == null) {
            throw new RuntimeException("To date is required");
        }
        if (fromDate.isAfter(toDate)) {
            throw new RuntimeException("From date cannot be after To date");
        }
        if (fromDate.isEqual(toDate)) {
            throw new RuntimeException("From date and To date cannot be the same");
        }
    }
}