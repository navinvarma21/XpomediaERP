package com.backend.school_erp.service.Store;

import com.backend.school_erp.DTO.Store.StockReportDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class StockReportService {

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

    public List<String> getAllItemNames(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        try {
            return jdbc.queryForList("SELECT DISTINCT description FROM purchase_daily WHERE school_id = ? ORDER BY description", String.class, schoolId);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public List<StockReportDTO> generateStockReport(String schoolId, LocalDate startDate, LocalDate endDate, String itemName) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        // Determine report type
        boolean isOverallReport = (startDate == null && endDate == null);
        boolean isDateRangeReport = (startDate != null && endDate != null);
        boolean isSingleDateReport = (startDate != null && endDate == null); // Legacy support

        // For backward compatibility
        LocalDate reportDate = isSingleDateReport ? startDate : null;

        // Map to store report data
        Map<String, StockReportDTO> reportMap = new HashMap<>();

        // 👇 1. GET ALL ITEMS (from both purchase and issue tables)
        Set<String> allItems = new HashSet<>();

        // Get items from purchase_daily
        StringBuilder itemsSql = new StringBuilder(
                "SELECT DISTINCT description FROM purchase_daily WHERE school_id = ? ");
        List<Object> itemsParams = new ArrayList<>();
        itemsParams.add(schoolId);

        if (isDateRangeReport) {
            itemsSql.append("AND entry_date BETWEEN ? AND ? ");
            itemsParams.add(startDate);
            itemsParams.add(endDate);
        } else if (reportDate != null) {
            itemsSql.append("AND entry_date <= ? ");
            itemsParams.add(reportDate);
        }

        if (itemName != null && !itemName.isEmpty() && !itemName.equals("Select Item") && !itemName.equals("Select Item (Optional)")) {
            itemsSql.append("AND description = ? ");
            itemsParams.add(itemName);
        }

        List<String> purchaseItems = jdbc.queryForList(itemsSql.toString(), itemsParams.toArray(), String.class);
        allItems.addAll(purchaseItems);

        // Get items from stock_report
        try {
            StringBuilder issuedItemsSql = new StringBuilder(
                    "SELECT DISTINCT description_name FROM stock_report WHERE school_id = ? ");
            List<Object> issuedItemsParams = new ArrayList<>();
            issuedItemsParams.add(schoolId);

            if (isDateRangeReport) {
                issuedItemsSql.append("AND date BETWEEN ? AND ? ");
                issuedItemsParams.add(startDate);
                issuedItemsParams.add(endDate);
            } else if (reportDate != null) {
                issuedItemsSql.append("AND date <= ? ");
                issuedItemsParams.add(reportDate);
            }

            if (itemName != null && !itemName.isEmpty() && !itemName.equals("Select Item") && !itemName.equals("Select Item (Optional)")) {
                issuedItemsSql.append("AND description_name = ? ");
                issuedItemsParams.add(itemName);
            }

            List<String> issuedItems = jdbc.queryForList(issuedItemsSql.toString(), issuedItemsParams.toArray(), String.class);
            allItems.addAll(issuedItems);
        } catch (Exception e) {
            // stock_report table might not exist
        }

        // 👇 2. CALCULATE OPENING BALANCE for each item
        Map<String, Long> openingBalances = new HashMap<>();
        Map<String, Long> closingBalances = new HashMap<>();

        for (String item : allItems) {
            long openingBalance = 0L;
            long closingBalance = 0L;

            if (isOverallReport) {
                // Overall Report: Opening = 0, Closing = Total Purchase - Total Issue (all time)
                Long totalPurchase = jdbc.queryForObject(
                        "SELECT COALESCE(SUM(quantity), 0) FROM purchase_daily WHERE school_id = ? AND description = ?",
                        Long.class, schoolId, item
                );

                Long totalIssued = 0L;
                try {
                    totalIssued = jdbc.queryForObject(
                            "SELECT COALESCE(SUM(quantity), 0) FROM stock_report WHERE school_id = ? AND description_name = ?",
                            Long.class, schoolId, item
                    );
                } catch (Exception e) {
                    totalIssued = 0L;
                }

                openingBalance = 0L;
                closingBalance = (totalPurchase != null ? totalPurchase : 0L) - (totalIssued != null ? totalIssued : 0L);

            } else if (isDateRangeReport) {
                // Date Range Report
                // Opening Balance = Balance BEFORE start date
                Long purchaseBefore = jdbc.queryForObject(
                        "SELECT COALESCE(SUM(quantity), 0) FROM purchase_daily WHERE school_id = ? AND description = ? AND entry_date < ?",
                        Long.class, schoolId, item, startDate
                );

                Long issuedBefore = 0L;
                try {
                    issuedBefore = jdbc.queryForObject(
                            "SELECT COALESCE(SUM(quantity), 0) FROM stock_report WHERE school_id = ? AND description_name = ? AND date < ?",
                            Long.class, schoolId, item, startDate
                    );
                } catch (Exception e) {
                    issuedBefore = 0L;
                }

                openingBalance = (purchaseBefore != null ? purchaseBefore : 0L) - (issuedBefore != null ? issuedBefore : 0L);

                // Closing Balance = Opening + Purchase during period - Issued during period
                Long purchaseDuring = jdbc.queryForObject(
                        "SELECT COALESCE(SUM(quantity), 0) FROM purchase_daily WHERE school_id = ? AND description = ? AND entry_date BETWEEN ? AND ?",
                        Long.class, schoolId, item, startDate, endDate
                );

                Long issuedDuring = 0L;
                try {
                    issuedDuring = jdbc.queryForObject(
                            "SELECT COALESCE(SUM(quantity), 0) FROM stock_report WHERE school_id = ? AND description_name = ? AND date BETWEEN ? AND ?",
                            Long.class, schoolId, item, startDate, endDate
                    );
                } catch (Exception e) {
                    issuedDuring = 0L;
                }

                closingBalance = openingBalance +
                        (purchaseDuring != null ? purchaseDuring : 0L) -
                        (issuedDuring != null ? issuedDuring : 0L);

            } else if (isSingleDateReport) {
                // Single Date Report (Legacy)
                // Opening = Balance BEFORE report date
                Long purchaseBefore = jdbc.queryForObject(
                        "SELECT COALESCE(SUM(quantity), 0) FROM purchase_daily WHERE school_id = ? AND description = ? AND entry_date < ?",
                        Long.class, schoolId, item, reportDate
                );

                Long issuedBefore = 0L;
                try {
                    issuedBefore = jdbc.queryForObject(
                            "SELECT COALESCE(SUM(quantity), 0) FROM stock_report WHERE school_id = ? AND description_name = ? AND date < ?",
                            Long.class, schoolId, item, reportDate
                    );
                } catch (Exception e) {
                    issuedBefore = 0L;
                }

                openingBalance = (purchaseBefore != null ? purchaseBefore : 0L) - (issuedBefore != null ? issuedBefore : 0L);

                // Purchase and Issued ON the report date
                Long purchaseOnDate = jdbc.queryForObject(
                        "SELECT COALESCE(SUM(quantity), 0) FROM purchase_daily WHERE school_id = ? AND description = ? AND entry_date = ?",
                        Long.class, schoolId, item, reportDate
                );

                Long issuedOnDate = 0L;
                try {
                    issuedOnDate = jdbc.queryForObject(
                            "SELECT COALESCE(SUM(quantity), 0) FROM stock_report WHERE school_id = ? AND description_name = ? AND date = ?",
                            Long.class, schoolId, item, reportDate
                    );
                } catch (Exception e) {
                    issuedOnDate = 0L;
                }

                Long purchaseDuring = jdbc.queryForObject(
                        "SELECT COALESCE(SUM(quantity), 0) FROM purchase_daily WHERE school_id = ? AND description = ? AND entry_date <= ?",
                        Long.class, schoolId, item, reportDate
                );

                Long issuedDuring = 0L;
                try {
                    issuedDuring = jdbc.queryForObject(
                            "SELECT COALESCE(SUM(quantity), 0) FROM stock_report WHERE school_id = ? AND description_name = ? AND date <= ?",
                            Long.class, schoolId, item, reportDate
                    );
                } catch (Exception e) {
                    issuedDuring = 0L;
                }

                closingBalance = (purchaseDuring != null ? purchaseDuring : 0L) - (issuedDuring != null ? issuedDuring : 0L);
            }

            openingBalances.put(item, openingBalance);
            closingBalances.put(item, closingBalance);
        }

        // 👇 3. GET ITEM DETAILS (Unit, Category, Standard)
        for (String item : allItems) {
            StockReportDTO dto = new StockReportDTO();
            dto.setDescription(item);
            dto.setOpeningBalance(openingBalances.get(item));
            dto.setClosingBalance(closingBalances.get(item));

            // Get purchase quantity during period
            Long purchaseQty = 0L;
            if (isOverallReport) {
                purchaseQty = jdbc.queryForObject(
                        "SELECT COALESCE(SUM(quantity), 0) FROM purchase_daily WHERE school_id = ? AND description = ?",
                        Long.class, schoolId, item
                );
            } else if (isDateRangeReport) {
                purchaseQty = jdbc.queryForObject(
                        "SELECT COALESCE(SUM(quantity), 0) FROM purchase_daily WHERE school_id = ? AND description = ? AND entry_date BETWEEN ? AND ?",
                        Long.class, schoolId, item, startDate, endDate
                );
            } else if (isSingleDateReport) {
                purchaseQty = jdbc.queryForObject(
                        "SELECT COALESCE(SUM(quantity), 0) FROM purchase_daily WHERE school_id = ? AND description = ? AND entry_date <= ?",
                        Long.class, schoolId, item, reportDate
                );
            }
            dto.setPurchaseQty(purchaseQty != null ? purchaseQty : 0L);

            // Get issued quantity during period
            Long issuedQty = 0L;
            try {
                if (isOverallReport) {
                    issuedQty = jdbc.queryForObject(
                            "SELECT COALESCE(SUM(quantity), 0) FROM stock_report WHERE school_id = ? AND description_name = ?",
                            Long.class, schoolId, item
                    );
                } else if (isDateRangeReport) {
                    issuedQty = jdbc.queryForObject(
                            "SELECT COALESCE(SUM(quantity), 0) FROM stock_report WHERE school_id = ? AND description_name = ? AND date BETWEEN ? AND ?",
                            Long.class, schoolId, item, startDate, endDate
                    );
                } else if (isSingleDateReport) {
                    issuedQty = jdbc.queryForObject(
                            "SELECT COALESCE(SUM(quantity), 0) FROM stock_report WHERE school_id = ? AND description_name = ? AND date <= ?",
                            Long.class, schoolId, item, reportDate
                    );
                }
            } catch (Exception e) {
                issuedQty = 0L;
            }
            dto.setIssuedQty(issuedQty != null ? issuedQty : 0L);

            // Calculate period balance
            dto.setBalanceQty(dto.getPurchaseQty() - dto.getIssuedQty());

            // Get item details from purchase_daily (latest record)
            try {
                Map<String, Object> itemDetails = jdbc.queryForMap(
                        "SELECT unit, head, standard FROM purchase_daily WHERE school_id = ? AND description = ? ORDER BY entry_date DESC LIMIT 1",
                        schoolId, item
                );
                dto.setUnit((String) itemDetails.get("unit"));
                dto.setCategory((String) itemDetails.get("head"));
                dto.setStandard((String) itemDetails.get("standard"));
            } catch (Exception e) {
                // Try stock table as fallback
                try {
                    Map<String, Object> stockDetails = jdbc.queryForMap(
                            "SELECT unit, head, standard FROM stock WHERE school_id = ? AND item_name = ? LIMIT 1",
                            schoolId, item
                    );
                    dto.setUnit((String) stockDetails.get("unit"));
                    dto.setCategory((String) stockDetails.get("head"));
                    dto.setStandard((String) stockDetails.get("standard"));
                } catch (Exception ex) {
                    dto.setUnit("-");
                    dto.setCategory("-");
                    dto.setStandard("-");
                }
            }

            reportMap.put(item, dto);
        }

        // 👇 4. CONVERT TO LIST AND SORT
        List<StockReportDTO> finalReport = new ArrayList<>(reportMap.values());

        // Filter out items with zero balances in all categories for Overall Report
        if (isOverallReport) {
            finalReport.removeIf(item ->
                    (item.getOpeningBalance() == 0 || item.getOpeningBalance() == null) &&
                            (item.getClosingBalance() == 0 || item.getClosingBalance() == null) &&
                            (item.getPurchaseQty() == 0 || item.getPurchaseQty() == null) &&
                            (item.getIssuedQty() == 0 || item.getIssuedQty() == null)
            );
        }

        // Sort by Standard, then Description
        finalReport.sort((a, b) -> {
            // First sort by Standard
            String std1 = a.getStandard() != null ? a.getStandard() : "ZZZ";
            String std2 = b.getStandard() != null ? b.getStandard() : "ZZZ";
            int stdCompare = std1.compareToIgnoreCase(std2);

            if (stdCompare != 0) {
                return stdCompare;
            }

            // Then sort by Description
            String desc1 = a.getDescription() != null ? a.getDescription() : "";
            String desc2 = b.getDescription() != null ? b.getDescription() : "";
            return desc1.compareToIgnoreCase(desc2);
        });

        return finalReport;
    }

    // 👇 NEW: Get grouped report by Standard
    public Map<String, List<StockReportDTO>> getGroupedStockReport(String schoolId, LocalDate startDate, LocalDate endDate, String itemName) {
        List<StockReportDTO> report = generateStockReport(schoolId, startDate, endDate, itemName);

        // Group by Standard
        Map<String, List<StockReportDTO>> groupedReport = new LinkedHashMap<>();

        for (StockReportDTO item : report) {
            String standard = item.getStandard() != null ? item.getStandard() : "Uncategorized";

            if (!groupedReport.containsKey(standard)) {
                groupedReport.put(standard, new ArrayList<>());
            }
            groupedReport.get(standard).add(item);
        }

        return groupedReport;
    }
}