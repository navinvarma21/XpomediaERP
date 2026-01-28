package com.backend.school_erp.service.Login;

import com.backend.school_erp.DTO.Login.LoginRequest;
import com.backend.school_erp.DTO.Login.LoginResponse;
import com.backend.school_erp.entity.Login.User;
import com.backend.school_erp.repository.Login.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public LoginResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }

        User user = userOpt.get();

        // ✅ Use BCrypt to check password hash
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        // ✅ Check if school is allowed to login based on status and dates
        if (!isSchoolAccessAllowed(user)) {
            // Provide specific error message based on the reason
            String errorMessage = getAccessDeniedReason(user);
            throw new RuntimeException(errorMessage);
        }

        // ✅ Generate random token (replace with JWT later if needed)
        String token = UUID.randomUUID().toString();

        return new LoginResponse(
                token,
                user.getSchoolId(),
                user.getSchoolCode(), // ✅ NEW: Pass schoolCode
                user.getSchoolName(),
                user.getEmail(),
                user.getStatus(),     // ✅ Pass status
                user.getFromDate(),   // ✅ Pass fromDate
                user.getToDate()      // ✅ Pass toDate
        );
    }

    private boolean isSchoolAccessAllowed(User user) {
        LocalDate today = LocalDate.now();

        // Rule 1: If status is "InActive" → ❌ Deny login (regardless of dates)
        if ("InActive".equalsIgnoreCase(user.getStatus())) {
            return false;
        }

        // Rule 2: If status is "Active" but dates are outside range → ❌ Deny login
        if ("Active".equalsIgnoreCase(user.getStatus())) {
            // If dates are not set, allow access (backward compatibility)
            if (user.getFromDate() == null || user.getToDate() == null) {
                return true;
            }

            // Check if current date is within the active period
            boolean isWithinDateRange = !today.isBefore(user.getFromDate()) && !today.isAfter(user.getToDate());

            // If manual override is enabled, only check the status field
            if (Boolean.TRUE.equals(user.getManualOverride())) {
                return true; // Manual override allows access regardless of dates
            }

            // No manual override - must be within date range
            return isWithinDateRange;
        }

        // Default deny for any other status
        return false;
    }

    private String getAccessDeniedReason(User user) {
        LocalDate today = LocalDate.now();

        // Rule 1: Status is "InActive"
        if ("InActive".equalsIgnoreCase(user.getStatus())) {
            return "School is not active. Please contact XPO Media.";
        }

        // Rule 2: Status is "Active" but dates are outside range
        if ("Active".equalsIgnoreCase(user.getStatus())) {
            if (user.getFromDate() != null && user.getToDate() != null) {
                if (today.isBefore(user.getFromDate())) {
                    return "School access period has not started yet. Access begins on " + user.getFromDate() + ". Please contact XPO Media.";
                } else if (today.isAfter(user.getToDate())) {
                    return "School access period has expired. Access ended on " + user.getToDate() + ". Please contact XPO Media.";
                }
            }
        }

        // Default message
        return "School access is not allowed. Please contact XPO Media.";
    }
}