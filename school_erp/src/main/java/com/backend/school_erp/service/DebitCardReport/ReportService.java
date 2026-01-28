package com.backend.school_erp.service.DebitCardReport;

import com.backend.school_erp.config.DatabaseConfig; // 1. Import AWS Config
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariConfig;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class ReportService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("Initializing HikariCP for school: {} on AWS RDS", id);

            HikariConfig config = new HikariConfig();

            // 2. Using AWS DB Constants from DatabaseConfig
            // Appends the schoolId as the specific database name
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName(DatabaseConfig.JDBC_DRIVER);

            // Performance and Stability settings for reporting
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);
            config.setMaxLifetime(1800000);
            config.setConnectionTimeout(10000);

            return new HikariDataSource(config);
        });
    }

    // --- TRIAL BALANCE GENERATOR ---
    public List<Map<String, Object>> getTrialBalance(String schoolId, LocalDate fromDate, LocalDate toDate, String academicYear, String type) {
        JdbcTemplate jdbc = new JdbcTemplate(getDataSource(schoolId));
        String tableName = type.equalsIgnoreCase("MISC") ? "day_book_mfc" : "day_book";

        // SQL: Group by Ledger
        String sql = String.format("""
            SELECT 
                ledger as ledgerName,
                SUM(credit) as totalReceipt,
                SUM(debit) as totalPayment
            FROM %s 
            WHERE academic_year = ? AND DATE(br_date) BETWEEN ? AND ?
            GROUP BY ledger
            ORDER BY ledger
        """, tableName);

        try {
            List<Map<String, Object>> rows = jdbc.queryForList(sql, academicYear, fromDate, toDate);

            // Separate lists to enforce "By" first, then "To"
            List<Map<String, Object>> byList = new ArrayList<>();
            List<Map<String, Object>> toList = new ArrayList<>();

            // 1. Calculate Opening Balance
            String openingSql = String.format("""
                SELECT COALESCE(SUM(credit) - SUM(debit), 0) 
                FROM %s 
                WHERE academic_year = ? AND DATE(br_date) < ?
            """, tableName);

            Double openingBal = jdbc.queryForObject(openingSql, Double.class, academicYear, fromDate);

            // 2. Add Actual Rows to specific lists
            for (Map<String, Object> row : rows) {
                Double receipt = row.get("totalReceipt") != null ? Double.valueOf(row.get("totalReceipt").toString()) : 0.0;
                Double payment = row.get("totalPayment") != null ? Double.valueOf(row.get("totalPayment").toString()) : 0.0;
                String rawName = (String) row.get("ledgerName");

                // --- Handle RECEIPTS (By) ---
                if (receipt > 0) {
                    Map<String, Object> byRow = new HashMap<>();
                    byRow.put("ledgerName", "By " + rawName);
                    byRow.put("totalReceipt", receipt);
                    byRow.put("totalPayment", 0.0);
                    byList.add(byRow);
                }

                // --- Handle PAYMENTS (To) ---
                if (payment > 0) {
                    Map<String, Object> toRow = new HashMap<>();
                    toRow.put("ledgerName", "To " + rawName);
                    toRow.put("totalReceipt", 0.0);
                    toRow.put("totalPayment", payment);
                    toList.add(toRow);
                }
            }

            // 3. Sort individual lists alphabetically by name
            Comparator<Map<String, Object>> nameComparator = (m1, m2) ->
                    ((String) m1.get("ledgerName")).compareTo((String) m2.get("ledgerName"));

            byList.sort(nameComparator);
            toList.sort(nameComparator);

            // 4. Construct Final Result List
            List<Map<String, Object>> result = new ArrayList<>();

            // A. Opening Balance
            Map<String, Object> openingRow = new HashMap<>();
            openingRow.put("ledgerName", "By Opening Bal.");
            openingRow.put("totalReceipt", openingBal > 0 ? openingBal : 0.0);
            openingRow.put("totalPayment", openingBal < 0 ? Math.abs(openingBal) : 0.0);
            openingRow.put("isSystemRow", true);
            result.add(openingRow);

            // B. Add All "By" Rows
            result.addAll(byList);

            // C. Add All "To" Rows
            result.addAll(toList);

            // 5. Calculate Closing "Cash in Hand" (Total In - Total Out)
            Double totalReceipts = result.stream().mapToDouble(m -> (Double) m.get("totalReceipt")).sum();
            Double totalPayments = result.stream().mapToDouble(m -> (Double) m.get("totalPayment")).sum();
            Double cashInHand = totalReceipts - totalPayments;

            Map<String, Object> closingRow = new HashMap<>();
            closingRow.put("ledgerName", "xCash in Hand");
            closingRow.put("totalPayment", cashInHand);
            closingRow.put("totalReceipt", 0.0);
            closingRow.put("isSystemRow", true);
            result.add(closingRow);

            return result;

        } catch (Exception e) {
            log.error("Error generating Trial Balance on AWS: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
