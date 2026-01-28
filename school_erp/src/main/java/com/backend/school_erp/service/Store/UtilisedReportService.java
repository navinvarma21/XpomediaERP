package com.backend.school_erp.service.Store;

import com.backend.school_erp.config.DatabaseConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UtilisedReportService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    // 1. Get Distinct Customers for Dropdown
    public List<Map<String, Object>> getCustomersFromSales(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        try {
            // Uses 'customer_code' and 'customer_name' from your provided list
            String sql = "SELECT DISTINCT customer_code, customer_name " +
                    "FROM sp_sales_daily " +
                    "WHERE customer_code IS NOT NULL AND customer_code != '' " +
                    "ORDER BY customer_name";
            return jdbc.queryForList(sql);
        } catch (Exception e) {
            System.err.println("Error fetching customers: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    // 2. Generate Report
    public List<Map<String, Object>> generateReport(String schoolId, LocalDate startDate, LocalDate endDate, String customerCode) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        try {
            StringBuilder sql = new StringBuilder();
            List<Object> params = new ArrayList<>();

            // ✅ Uses 'issue_date' instead of 'date' based on your column list
            sql.append("SELECT issue_date, bill_no, item_name, quantity, customer_name, total_amount ");
            sql.append("FROM sp_sales_daily ");
            sql.append("WHERE issue_date BETWEEN ? AND ? ");

            params.add(startDate);
            params.add(endDate);

            // Filter by Customer Code
            if (customerCode != null && !customerCode.trim().isEmpty()) {
                sql.append("AND customer_code = ? ");
                params.add(customerCode);
            }

            sql.append("ORDER BY issue_date DESC, bill_no DESC");

            return jdbc.queryForList(sql.toString(), params.toArray());
        } catch (Exception e) {
            System.err.println("Error generating utilised report: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
}