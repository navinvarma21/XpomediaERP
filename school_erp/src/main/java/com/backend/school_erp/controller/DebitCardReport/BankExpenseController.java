package com.backend.school_erp.controller.DebitCardReport;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class BankExpenseController {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    // Helper to create/get DataSource (Simulating your service logic)
    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(createDataSource(schoolId));
    }

    private DataSource createDataSource(String schoolId) {
        com.zaxxer.hikari.HikariConfig config = new com.zaxxer.hikari.HikariConfig();
        // Ensure these match your env/config
        String dbName = schoolId;
        config.setJdbcUrl("jdbc:mysql://localhost:3306/" + dbName + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata");
        config.setUsername("root");
        config.setPassword("MySQL@3306");
        return new com.zaxxer.hikari.HikariDataSource(config);
    }

    @GetMapping("/bank-expenses-summary")
    public ResponseEntity<?> getBankExpensesSummary(
            @RequestParam String schoolId,
            @RequestParam String fromDate,
            @RequestParam String toDate,
            @RequestParam String academicYear // Added academicYear param
    ) {

        try {
            JdbcTemplate jdbc = getJdbcTemplate(schoolId);

            // SENIOR ACCOUNTANT LOGIC:
            // 1. We are looking for EXPENSES (Money Out) -> Debit side of Day Book.
            // 2. Mode must be 'Bank', 'Online', 'Cheque', 'UPI' (anything NOT 'Cash').
            // 3. Filter by Academic Year for strict data isolation.
            // 4. Group by the Ledger Head (Description).

            String sql = """
                SELECT 
                    ledger AS description, 
                    SUM(debit) AS totalAmount 
                FROM day_book 
                WHERE school_id = ? 
                AND academic_year = ? 
                AND DATE(br_date) BETWEEN ? AND ?
                AND LOWER(mode) IN ('bank', 'online', 'cheque', 'neft', 'rtgs', 'upi', 'card')
                GROUP BY ledger
                ORDER BY ledger ASC
            """;

            // Passed academicYear to query parameters
            List<Map<String, Object>> reportData = jdbc.queryForList(sql, schoolId, academicYear, fromDate, toDate);

            return ResponseEntity.ok(reportData);

        } catch (Exception e) {
            log.error("Error generating bank expense summary", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}