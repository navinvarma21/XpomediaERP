package com.backend.school_erp.service.Store;

import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Store.TabPurchase;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PurchaseReportService {

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

    // 1. Get Distinct Suppliers ONLY from 'Purchase' entries
    public List<Map<String, Object>> getSuppliersFromTransactions(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        // Fix: Added WHERE tin = 'Purchase' so we don't fetch unrelated records
        String sql = "SELECT DISTINCT supplier_code, supplier_name FROM tab_purchase WHERE tin = 'Purchase' ORDER BY supplier_name";
        return jdbc.queryForList(sql);
    }

    // 2. Generate Report with Date Range (Existing)
    public List<TabPurchase> generateReport(String schoolId, LocalDate startDate, LocalDate endDate, String supplierCode) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        // Fix: Added 'tin = Purchase' to filter
        StringBuilder sql = new StringBuilder("SELECT * FROM tab_purchase WHERE tin = 'Purchase' AND purchase_date BETWEEN ? AND ? ");

        List<Object> params = new ArrayList<>();
        params.add(startDate);
        params.add(endDate); // This works perfectly for Single Day (e.g., 2023-01-01 to 2023-01-01)

        if (supplierCode != null && !supplierCode.isEmpty()) {
            sql.append("AND supplier_code = ? ");
            params.add(supplierCode);
        }

        sql.append("ORDER BY purchase_date ASC, entry_no ASC");

        return jdbc.query(sql.toString(), new BeanPropertyRowMapper<>(TabPurchase.class), params.toArray());
    }

    // 3. NEW: Get all purchases for selected supplier (without date range)
    public List<TabPurchase> getAllPurchasesForSupplier(String schoolId, String supplierCode) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        StringBuilder sql = new StringBuilder("SELECT * FROM tab_purchase WHERE tin = 'Purchase' ");

        List<Object> params = new ArrayList<>();

        if (supplierCode != null && !supplierCode.isEmpty()) {
            sql.append("AND supplier_code = ? ");
            params.add(supplierCode);
        }

        sql.append("ORDER BY purchase_date ASC, entry_no ASC");

        if (params.isEmpty()) {
            return jdbc.query(sql.toString(), new BeanPropertyRowMapper<>(TabPurchase.class));
        } else {
            return jdbc.query(sql.toString(), new BeanPropertyRowMapper<>(TabPurchase.class), params.toArray());
        }
    }

    // 4. NEW: Get all purchases (without any filters)
    public List<TabPurchase> getAllPurchases(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        String sql = "SELECT * FROM tab_purchase WHERE tin = 'Purchase' ORDER BY purchase_date ASC, entry_no ASC";

        return jdbc.query(sql.toString(), new BeanPropertyRowMapper<>(TabPurchase.class));
    }
}