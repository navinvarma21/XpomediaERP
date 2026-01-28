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
public class BookDistributeReportService {

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

    public List<Map<String, Object>> generateReport(String schoolId, LocalDate startDate, LocalDate endDate, boolean isOverall) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        StringBuilder sql = new StringBuilder();
        List<Object> params = new ArrayList<>();

        // ✅ CALCULATE amount from total_amount / quantity to avoid column issues
        sql.append("SELECT bill_no, fee_date, student_name, standard, section, description_name, quantity, ");
        sql.append("CASE WHEN quantity > 0 THEN ROUND(total_amount / quantity, 2) ELSE 0 END as amount, ");
        sql.append("total_amount ");
        sql.append("FROM notebook ");
        sql.append("WHERE school_id = ? ");
        params.add(schoolId);

        // Filter by Date only if NOT Overall
        if (!isOverall) {
            sql.append("AND fee_date BETWEEN ? AND ? ");
            params.add(startDate);
            params.add(endDate);
        }

        sql.append("ORDER BY fee_date DESC, bill_no DESC");

        return jdbc.queryForList(sql.toString(), params.toArray());
    }
}