package com.backend.school_erp.controller.DebitCardReport;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class CashExpenseController {

    // Ideally, inject a Service. For brevity in this "Senior Dev" fix,
    // I am implementing the optimized JDBC logic directly here to ensure
    // strict adherence to the grouping logic requested.

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        // Reuse your existing DataSource logic here
        // Assuming you have a mechanism to get the data source per school
        // For now, I will use a placeholder for the connection logic based on your previous Context
        return new JdbcTemplate(createDataSource(schoolId));
    }

    // Helper to create DS (Reuse your existing Service logic for this)
    private DataSource createDataSource(String schoolId) {
        // ... (Keep your existing HikariCP logic from PaymentEntryService)
        // For the sake of this code block, assume this returns the valid DS
        com.zaxxer.hikari.HikariConfig config = new com.zaxxer.hikari.HikariConfig();
        String dbName = schoolId; // Or your mapping logic
        config.setJdbcUrl("jdbc:mysql://localhost:3306/" + dbName + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata");
        config.setUsername("root"); // Use env vars
        config.setPassword("MySQL@3306"); // Use env vars
        return new com.zaxxer.hikari.HikariDataSource(config);
    }

    @GetMapping("/cash-expenses-summary")
    public ResponseEntity<?> getCashExpensesSummary(
            @RequestParam String schoolId,
            @RequestParam String fromDate,
            @RequestParam String toDate,
            @RequestParam String academicYear // Added academicYear param
    ) {

        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            // SENIOR DEV LOGIC:
            // 1. Filter by School & Academic Year (Strict Data Isolation)
            // 2. Filter by Date Range
            // 3. Filter by Mode = 'cash'
            // 4. GROUP BY ledger (Description)
            // 5. SUM(debit) as payments

            String sql = """
                SELECT 
                    ledger AS description, 
                    SUM(debit) AS totalAmount 
                FROM day_book 
                WHERE school_id = ? 
                AND academic_year = ? 
                AND DATE(br_date) BETWEEN ? AND ?
                AND LOWER(mode) = 'cash'
                GROUP BY ledger
                ORDER BY ledger ASC
            """;

            // Passed academicYear to query params
            List<Map<String, Object>> reportData = jdbc.queryForList(sql, schoolId, academicYear, fromDate, toDate);

            return ResponseEntity.ok(reportData);

        } catch (Exception e) {
            log.error("Error generating cash expense summary", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}