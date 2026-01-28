package com.backend.school_erp.service.ReceiptPaymentReport;

import com.backend.school_erp.DTO.ReceiptPaymentReport.ExpenseReportDTO;
import com.backend.school_erp.DTO.ReceiptPaymentReport.ReceiptDetailsReportDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class ReceiptPaymentReportService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            config.setMaximumPoolSize(15);
            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    @Transactional(readOnly = true)
    public List<ReceiptDetailsReportDTO> getReceiptDetails(String schoolId, String academicYear, String startDate, String endDate, String feeHead) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        StringBuilder sql = new StringBuilder("""
            SELECT r.receipt_no AS receiptNo, r.date, r.category AS feeHead, r.account_head AS accountHead,
                   r.person_name AS personName, r.description, r.receipt_mode AS receiptMode,
                   r.reference_id AS referenceId, r.amount
            FROM receipt_entries r
            WHERE r.school_id = ? AND r.academic_year = ? AND r.date BETWEEN ? AND ?
        """);

        List<Object> params = new ArrayList<>();
        params.add(schoolId); params.add(academicYear); params.add(startDate); params.add(endDate);

        if (feeHead != null && !feeHead.trim().isEmpty() && !feeHead.equalsIgnoreCase("All")) {
            sql.append(" AND r.category = ?");
            params.add(feeHead);
        }
        sql.append(" ORDER BY r.date DESC, CAST(SUBSTRING(r.receipt_no, 3) AS UNSIGNED) DESC");

        return jdbc.query(sql.toString(), new BeanPropertyRowMapper<>(ReceiptDetailsReportDTO.class), params.toArray());
    }

    @Transactional(readOnly = true)
    public List<ExpenseReportDTO> getDayExpenses(String schoolId, String academicYear, String date) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        // Added p.reference_id AS referenceId
        String sql = """
            SELECT p.entry_no AS entryNo, p.date, p.expense_name AS mainHead, p.account_head AS subHead,
                   p.receiver_name AS receiverName, p.description, p.payment_mode AS paymentMode,
                   p.reference_id AS referenceId, p.amount
            FROM payment_entries p
            WHERE p.school_id = ? AND p.academic_year = ? AND p.date = ?
            ORDER BY CAST(p.entry_no AS UNSIGNED) ASC
        """;
        return jdbc.query(sql, new BeanPropertyRowMapper<>(ExpenseReportDTO.class), schoolId, academicYear, date);
    }

    @Transactional(readOnly = true)
    public List<ExpenseReportDTO> getPeriodExpenses(String schoolId, String academicYear, String startDate, String endDate) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        // Added p.reference_id AS referenceId
        String sql = """
            SELECT p.entry_no AS entryNo, p.date, p.expense_name AS mainHead, p.account_head AS subHead,
                   p.receiver_name AS receiverName, p.description, p.payment_mode AS paymentMode,
                   p.reference_id AS referenceId, p.amount
            FROM payment_entries p
            WHERE p.school_id = ? AND p.academic_year = ? AND p.date BETWEEN ? AND ?
            ORDER BY p.date ASC, CAST(p.entry_no AS UNSIGNED) ASC
        """;
        return jdbc.query(sql, new BeanPropertyRowMapper<>(ExpenseReportDTO.class), schoolId, academicYear, startDate, endDate);
    }
}