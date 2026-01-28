package com.backend.school_erp.service.Store;

import com.backend.school_erp.config.DatabaseConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LedgerService {

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

    // 1. Get Distinct Suppliers
    public List<Map<String, Object>> getSuppliers(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        try {
            String sql = "SELECT DISTINCT supplier_code, supplier_name FROM tab_purchase WHERE school_id = ? ORDER BY supplier_name";
            return jdbc.queryForList(sql, schoolId);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    // 2. Generate Ledger - FIXED VERSION
    public List<Map<String, Object>> generateLedger(String schoolId, LocalDate startDate, LocalDate endDate, String supplierCode) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        List<Map<String, Object>> result = new ArrayList<>();

        try {
            StringBuilder sql = new StringBuilder();
            List<Object> params = new ArrayList<>();

            // FIXED SQL: Properly format dates and join with suppliers for address
            sql.append("SELECT ");
            sql.append("t.id, ");
            sql.append("DATE_FORMAT(t.purchase_date, '%d/%m/%Y') as purchase_date, "); // Format as dd/mm/yyyy
            sql.append("t.supplier_code, ");
            sql.append("t.supplier_name, ");
            sql.append("COALESCE(t.narrative, t.purchase_narrative, '') as narrative, ");
            sql.append("t.credit, ");
            sql.append("t.debit, ");
            sql.append("t.invoice_no, ");
            sql.append("DATE(t.purchase_date) as raw_date, "); // For day calculation
            sql.append("COALESCE(s.address, 'N/A') as address ");
            sql.append("FROM tab_purchase t ");
            sql.append("LEFT JOIN suppliers s ON t.supplier_code = s.supplier_code AND t.school_id = s.school_id ");
            sql.append("WHERE t.school_id = ? ");
            sql.append("AND DATE(t.purchase_date) BETWEEN ? AND ? ");

            params.add(schoolId);
            params.add(startDate);
            params.add(endDate);

            if (supplierCode != null && !supplierCode.isEmpty()) {
                sql.append("AND t.supplier_code = ? ");
                params.add(supplierCode);
            }

            sql.append("ORDER BY t.supplier_code, t.purchase_date ASC, t.id ASC");

            List<Map<String, Object>> rawData = jdbc.queryForList(sql.toString(), params.toArray());

            Map<String, Map<String, Object>> supplierMap = new HashMap<>();

            for (Map<String, Object> row : rawData) {
                String sCode = (String) row.get("supplier_code");

                if (!supplierMap.containsKey(sCode)) {
                    Map<String, Object> sData = new HashMap<>();
                    sData.put("supplier_code", sCode);
                    sData.put("supplier_name", row.get("supplier_name"));
                    sData.put("address", row.get("address") != null ? row.get("address") : "");
                    sData.put("transactions", new ArrayList<Map<String, Object>>());
                    sData.put("total_paid", 0.0);
                    sData.put("total_purchase", 0.0);
                    sData.put("total_balance", 0.0);
                    supplierMap.put(sCode, sData);
                }

                Map<String, Object> currentSupplier = supplierMap.get(sCode);
                List<Map<String, Object>> transList = (List<Map<String, Object>>) currentSupplier.get("transactions");

                // Get raw date for day calculation
                LocalDate transDate = null;
                if(row.get("raw_date") != null) {
                    if(row.get("raw_date") instanceof java.sql.Date) {
                        transDate = ((java.sql.Date) row.get("raw_date")).toLocalDate();
                    } else {
                        transDate = LocalDate.parse(row.get("raw_date").toString());
                    }
                }

                // ✅ FIXED: Day calculation - Days elapsed since Report Start Date + 1
                long dayNumber = 1; // Default to 1
                if (transDate != null && startDate != null) {
                    // Day should start from 1 (first day of report)
                    dayNumber = ChronoUnit.DAYS.between(startDate, transDate);
                    if (dayNumber < 0) dayNumber = 1;
                    dayNumber = dayNumber + 1; // Make it 1-based
                }

                double credit = row.get("credit") != null ? Double.parseDouble(row.get("credit").toString()) : 0.0;
                double debit = row.get("debit") != null ? Double.parseDouble(row.get("debit").toString()) : 0.0;

                // Calculate running balance
                double prevBalance = (Double) currentSupplier.get("total_balance");
                double currentBalance = prevBalance + credit - debit;

                // Add to totals
                double totalPaid = (Double) currentSupplier.get("total_paid") + debit;
                double totalPurchase = (Double) currentSupplier.get("total_purchase") + credit;

                currentSupplier.put("total_paid", totalPaid);
                currentSupplier.put("total_purchase", totalPurchase);
                currentSupplier.put("total_balance", currentBalance);

                Map<String, Object> trans = new HashMap<>();
                trans.put("id", row.get("id"));
                trans.put("date", row.get("purchase_date")); // Already formatted as dd/mm/yyyy
                trans.put("description", row.get("narrative"));
                trans.put("paid_amount", debit);
                trans.put("purchase_amount", credit);
                trans.put("balance", currentBalance);
                trans.put("invoice_no", row.get("invoice_no"));
                trans.put("day", (int) dayNumber);

                transList.add(trans);
            }

            // Format totals and add to result
            for (Map<String, Object> sData : supplierMap.values()) {
                // Format totals with Indian numbering
                double totalPaid = (Double) sData.get("total_paid");
                double totalPurchase = (Double) sData.get("total_purchase");
                double totalBalance = (Double) sData.get("total_balance");

                sData.put("total_paid", formatIndianNumber(totalPaid));
                sData.put("total_purchase", formatIndianNumber(totalPurchase));
                sData.put("total_balance", formatIndianNumber(totalBalance));
                result.add(sData);
            }

            // Sort by supplier name
            result.sort((a, b) -> {
                String nameA = (String) a.get("supplier_name");
                String nameB = (String) b.get("supplier_name");
                if (nameA == null) nameA = "";
                if (nameB == null) nameB = "";
                return nameA.compareToIgnoreCase(nameB);
            });

        } catch (Exception e) {
            e.printStackTrace();
        }

        return result;
    }

    // Helper method to format numbers in Indian style
    private String formatIndianNumber(double value) {
        if (value == 0.0) return "0.00";

        // Format with 2 decimal places
        String formatted = String.format("%.2f", value);

        // Add commas for thousands
        String[] parts = formatted.split("\\.");
        String integerPart = parts[0];
        String decimalPart = parts.length > 1 ? parts[1] : "00";

        // Indian numbering system
        StringBuilder result = new StringBuilder();
        int len = integerPart.length();
        for (int i = 0; i < len; i++) {
            if (i > 0 && (len - i) % 2 == 0 && i != len - 3) {
                result.append(",");
            }
            result.append(integerPart.charAt(i));
        }

        return result.toString() + "." + decimalPart;
    }
}