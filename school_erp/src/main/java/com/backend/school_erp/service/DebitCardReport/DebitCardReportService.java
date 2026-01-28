package com.backend.school_erp.service.DebitCardReport;

import com.backend.school_erp.DTO.DebitCardReport.LedgerReportDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class DebitCardReportService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        DataSource ds = dataSourceCache.computeIfAbsent(schoolId, id -> {
            HikariConfig config = new HikariConfig();

            // 2. Use AWS DB Constants from DatabaseConfig
            // Appends the schoolId as the specific database name
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName(DatabaseConfig.JDBC_DRIVER);

            // Pool performance settings for complex report generation
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);
            config.setMaxLifetime(1800000);
            config.setConnectionTimeout(10000);

            return new HikariDataSource(config);
        });
        return new JdbcTemplate(ds);
    }

    private String getTableName(String type) {
        return "MISC".equalsIgnoreCase(type) ? "day_book_mfc" : "day_book";
    }

    // Original Logic for Day Ledger
    public List<LedgerReportDTO> getDayLedger(String schoolId, String date, String academicYear, String type) {
        String tableName = getTableName(type);
        JdbcTemplate jdbcTemplate = getJdbcTemplate(schoolId);

        // FILTER OPENING BALANCE ALSO BY ACADEMIC YEAR (Isolate calculations per year)
        String openingSql = String.format("SELECT SUM(credit) - SUM(debit) FROM %s WHERE school_id = ? AND academic_year = ? AND DATE(br_date) < ?", tableName);
        Double openingBalanceVal = jdbcTemplate.queryForObject(openingSql, Double.class, schoolId, academicYear, date);
        if (openingBalanceVal == null) openingBalanceVal = 0.0;

        String sql = String.format("""
            SELECT id, br_number as brNumber, admission_number as admissionNumber, name, 
                   br_date as date, description, ledger, credit, debit, mode, operator_name as operatorName
            FROM %s 
            WHERE school_id = ? AND academic_year = ? AND DATE(br_date) = ?
            ORDER BY br_date ASC
        """, tableName);

        List<LedgerReportDTO> rawTransactions = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(LedgerReportDTO.class), schoolId, academicYear, date);

        List<LedgerReportDTO> bankGroup = new ArrayList<>();
        List<LedgerReportDTO> cashGroup = new ArrayList<>();
        double bankCreditTotal = 0.0;
        double bankDebitTotal = 0.0;
        double cashCreditTotal = 0.0;
        double cashDebitTotal = 0.0;

        for (LedgerReportDTO txn : rawTransactions) {
            if (txn.getMode() != null && "cash".equalsIgnoreCase(txn.getMode())) {
                cashGroup.add(txn);
                cashCreditTotal += (txn.getCredit() != null ? txn.getCredit() : 0);
                cashDebitTotal += (txn.getDebit() != null ? txn.getDebit() : 0);
            } else {
                if (txn.getLedger() != null && txn.getLedger().contains("IB-890262450")) {
                    txn.setLedger("Bank");
                }
                bankGroup.add(txn);
                bankCreditTotal += (txn.getCredit() != null ? txn.getCredit() : 0);
                bankDebitTotal += (txn.getDebit() != null ? txn.getDebit() : 0);

                if (txn.getCredit() != null && txn.getCredit() > 0) {
                    LedgerReportDTO contraEntry = new LedgerReportDTO();
                    contraEntry.setId(txn.getId());
                    contraEntry.setBrNumber(txn.getBrNumber());
                    contraEntry.setAdmissionNumber(txn.getAdmissionNumber());
                    contraEntry.setName(txn.getName());
                    contraEntry.setDate(txn.getDate());
                    contraEntry.setOperatorName(txn.getOperatorName());
                    contraEntry.setLedger("Bank");
                    contraEntry.setDescription("");
                    contraEntry.setCredit(null);
                    contraEntry.setDebit(txn.getCredit());
                    contraEntry.setMode(txn.getMode());
                    bankGroup.add(contraEntry);
                }
            }
        }

        List<LedgerReportDTO> finalReport = new ArrayList<>();
        LedgerReportDTO bankHeader = new LedgerReportDTO(); bankHeader.setLedger("Bank"); bankHeader.setMode("HEADER"); finalReport.add(bankHeader);
        LedgerReportDTO openingRow = new LedgerReportDTO(); openingRow.setLedger("1.Bank Opening Balance"); openingRow.setCredit(openingBalanceVal); openingRow.setDebit(0.0); openingRow.setMode("SYSTEM"); finalReport.add(openingRow);
        finalReport.addAll(bankGroup);
        double bankClosingVal = openingBalanceVal + bankCreditTotal - bankDebitTotal;
        LedgerReportDTO bankClosingRow = new LedgerReportDTO(); bankClosingRow.setLedger("z.Bank-Closing Balance"); bankClosingRow.setCredit(0.0); bankClosingRow.setDebit(bankClosingVal); bankClosingRow.setMode("SYSTEM"); finalReport.add(bankClosingRow);

        LedgerReportDTO cashHeader = new LedgerReportDTO(); cashHeader.setLedger("Cash"); cashHeader.setMode("HEADER"); finalReport.add(cashHeader);
        finalReport.addAll(cashGroup);
        double cashClosingVal = bankClosingVal + cashCreditTotal - cashDebitTotal;
        LedgerReportDTO cashClosingRow = new LedgerReportDTO(); cashClosingRow.setLedger("z.Cash Closing Bal."); cashClosingRow.setCredit(0.0); cashClosingRow.setDebit(cashClosingVal); cashClosingRow.setMode("SYSTEM"); finalReport.add(cashClosingRow);

        return finalReport;
    }

    public List<LedgerReportDTO> getPeriodLedger(String schoolId, String from, String to, String head, String academicYear, String type) {
        String tableName = getTableName(type);
        JdbcTemplate jdbcTemplate = getJdbcTemplate(schoolId);
        List<LedgerReportDTO> finalReport = new ArrayList<>();

        String openingSql = String.format("SELECT SUM(credit) - SUM(debit) FROM %s WHERE school_id = ? AND academic_year = ? AND DATE(br_date) < ?", tableName);
        Double openingBalanceVal = jdbcTemplate.queryForObject(openingSql, Double.class, schoolId, academicYear, from);
        if (openingBalanceVal == null) openingBalanceVal = 0.0;

        LedgerReportDTO openingRow = new LedgerReportDTO();
        openingRow.setLedger("Opening Balance");
        openingRow.setDescription("Nil");
        openingRow.setBrNumber("0");
        openingRow.setName("");
        openingRow.setOperatorName("");
        openingRow.setCredit(openingBalanceVal >= 0 ? openingBalanceVal : 0.0);
        openingRow.setDebit(openingBalanceVal < 0 ? Math.abs(openingBalanceVal) : 0.0);
        openingRow.setMode("OPENING");

        finalReport.add(openingRow);

        StringBuilder sql = new StringBuilder(String.format("""
            SELECT id, br_number as brNumber, admission_number as admissionNumber, name, 
                   br_date as date, description, ledger, credit, debit, mode, operator_name as operatorName
            FROM %s 
            WHERE school_id = ? AND academic_year = ? AND DATE(br_date) BETWEEN ? AND ?
        """, tableName));

        List<Object> params = new ArrayList<>();
        params.add(schoolId);
        params.add(academicYear); // Added academicYear param
        params.add(from);
        params.add(to);

        if (head != null && !head.isEmpty()) {
            sql.append(" AND ledger = ?");
            params.add(head);
        }

        sql.append(" ORDER BY br_date ASC, id ASC");

        List<LedgerReportDTO> transactions = jdbcTemplate.query(sql.toString(), new BeanPropertyRowMapper<>(LedgerReportDTO.class), params.toArray());
        finalReport.addAll(transactions);

        return finalReport;
    }

    // *** UPGRADED BANK LEDGER: Includes Opening Balance & Chronological Sort ***
    public List<LedgerReportDTO> getBankLedger(String schoolId, String from, String to, String head, String academicYear, String type) {
        String tableName = getTableName(type);
        JdbcTemplate jdbcTemplate = getJdbcTemplate(schoolId);
        List<LedgerReportDTO> finalReport = new ArrayList<>();

        // 1. Calculate Bank Opening Balance (Credit - Debit for all Non-Cash modes prior to 'from' date)
        // Note: For Assets, usually Debit - Credit, but your system uses Credit for Receipts.
        // We will stick to your system's convention: (Receipts - Payments)
        String openingSql = String.format("""
            SELECT SUM(credit) - SUM(debit) 
            FROM %s 
            WHERE school_id = ? AND academic_year = ? 
            AND DATE(br_date) < ?
            AND LOWER(mode) NOT IN ('cash')
        """, tableName);

        Double openingBalanceVal = jdbcTemplate.queryForObject(openingSql, Double.class, schoolId, academicYear, from);
        if (openingBalanceVal == null) openingBalanceVal = 0.0;

        // 2. Add Opening Row
        LedgerReportDTO openingRow = new LedgerReportDTO();
        openingRow.setLedger("Opening Balance");
        openingRow.setBrNumber("0");
        openingRow.setCredit(openingBalanceVal >= 0 ? openingBalanceVal : 0.0);
        openingRow.setDebit(openingBalanceVal < 0 ? Math.abs(openingBalanceVal) : 0.0);
        openingRow.setMode("OPENING"); // Frontend uses this to highlight row

        finalReport.add(openingRow);

        // 3. Fetch Transactions
        StringBuilder sql = new StringBuilder(String.format("""
            SELECT id, br_number as brNumber, admission_number as admissionNumber, name, 
                   br_date as date, description, ledger, credit, debit, mode, operator_name as operatorName
            FROM %s 
            WHERE school_id = ? AND academic_year = ? AND DATE(br_date) BETWEEN ? AND ? 
            AND LOWER(mode) NOT IN ('cash')
        """, tableName));

        List<Object> params = new ArrayList<>();
        params.add(schoolId);
        params.add(academicYear); // Added academicYear param
        params.add(from);
        params.add(to);

        if (head != null && !head.isEmpty()) {
            sql.append(" AND ledger = ?");
            params.add(head);
        }

        // IMPORTANT: Sorted ASC so running balance makes sense
        sql.append(" ORDER BY br_date ASC, id ASC");

        List<LedgerReportDTO> transactions = jdbcTemplate.query(sql.toString(), new BeanPropertyRowMapper<>(LedgerReportDTO.class), params.toArray());
        finalReport.addAll(transactions);

        return finalReport;
    }

    public List<LedgerReportDTO> getExpenses(String schoolId, String from, String to, String modeType, String academicYear, String type) {
        String tableName = getTableName(type);
        StringBuilder sql = new StringBuilder(String.format("""
            SELECT id, br_number as brNumber, admission_number as admissionNumber, name, 
                   br_date as date, description, ledger, credit, debit, mode, operator_name as operatorName
            FROM %s 
            WHERE school_id = ? AND academic_year = ? AND DATE(br_date) BETWEEN ? AND ? 
            AND debit > 0
        """, tableName));

        List<Object> params = new ArrayList<>();
        params.add(schoolId);
        params.add(academicYear); // Added academicYear param
        params.add(from);
        params.add(to);

        if ("CASH".equalsIgnoreCase(modeType)) {
            sql.append(" AND LOWER(mode) = 'cash'");
        } else {
            sql.append(" AND LOWER(mode) != 'cash'");
        }

        sql.append(" ORDER BY br_date DESC");
        return getJdbcTemplate(schoolId).query(sql.toString(), new BeanPropertyRowMapper<>(LedgerReportDTO.class), params.toArray());
    }

    public List<String> getUniqueHeads(String schoolId, String academicYear, String type) {
        String tableName = getTableName(type);
        String sql = String.format("SELECT DISTINCT ledger FROM %s WHERE school_id = ? AND academic_year = ? ORDER BY ledger", tableName);
        return getJdbcTemplate(schoolId).queryForList(sql, String.class, schoolId, academicYear);
    }
}