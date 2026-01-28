package com.backend.school_erp.service.DebitCardReport;

import com.backend.school_erp.DTO.DebitCardReport.ConsolidatedStrengthDTO;
import com.backend.school_erp.config.DatabaseConfig; // 1. Import your AWS Config
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class ConsolidatedStrengthService {

    // Cache for multi-tenant data sources
    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("Initializing AWS RDS connection pool for school: {}", id);

            HikariConfig config = new HikariConfig();

            // 2. Using AWS DB Constants from DatabaseConfig
            // The URL is constructed by appending the schoolId to the base AWS URL
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName(DatabaseConfig.JDBC_DRIVER);

            // Pool settings optimized for reporting
            config.setMaximumPoolSize(5);
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);
            config.setMaxLifetime(1800000);
            config.setConnectionTimeout(10000);

            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    public List<ConsolidatedStrengthDTO> getConsolidatedStrength(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String safeYear = academicYear.replaceAll("[^a-zA-Z0-9]", "_");

        String admissionTable = "admissions_" + safeYear;
        String tcTable = "TC_" + safeYear;

        if (!tableExists(jdbc, admissionTable)) {
            log.warn("Admission table not found for: {}", safeYear);
            return new ArrayList<>();
        }

        // 1. Fetch Admissions Grouped by Std/Sec
        String admSql = """
            SELECT 
                COALESCE(standard, 'Unknown') as standard, 
                COALESCE(section, '') as section,
                COALESCE(SUM(CASE WHEN student_type = 'Existing' THEN 1 ELSE 0 END), 0) as old_count,
                COALESCE(SUM(CASE WHEN student_type = 'New' THEN 1 ELSE 0 END), 0) as new_count
            FROM %s 
            GROUP BY standard, section
            ORDER BY standard, section
        """.formatted(admissionTable);

        List<Map<String, Object>> admissionStats = jdbc.queryForList(admSql);

        // 2. Fetch TC Counts Grouped by Std/Sec (BULK FETCH)
        Map<String, Long> tcCountMap = new HashMap<>();
        if (tableExists(jdbc, tcTable)) {
            try {
                String tcSql = """
                    SELECT 
                        COALESCE(standard, 'Unknown') as standard, 
                        COALESCE(section, '') as section, 
                        COUNT(*) as count 
                    FROM %s 
                    GROUP BY standard, section
                """.formatted(tcTable);

                List<Map<String, Object>> tcStats = jdbc.queryForList(tcSql);

                for (Map<String, Object> row : tcStats) {
                    String std = (String) row.get("standard");
                    String sec = (String) row.get("section");
                    long count = ((Number) row.get("count")).longValue();
                    tcCountMap.put(std + "-" + sec, count);
                }
            } catch (Exception e) {
                log.error("Error fetching TC stats from AWS RDS: {}", e.getMessage());
            }
        }

        // 3. Merge Data
        List<ConsolidatedStrengthDTO> report = new ArrayList<>();

        for (Map<String, Object> row : admissionStats) {
            String standard = (String) row.get("standard");
            String section = (String) row.get("section");

            long oldNos = ((Number) row.get("old_count")).longValue();
            long newNos = ((Number) row.get("new_count")).longValue();
            long leftWithTc = tcCountMap.getOrDefault(standard + "-" + section, 0L);
            long leftWithoutTc = 0;

            long totalStrength = (oldNos + newNos) - (leftWithTc + leftWithoutTc);
            if(totalStrength < 0) totalStrength = 0;

            report.add(ConsolidatedStrengthDTO.builder()
                    .grade(standard)
                    .section(section)
                    .oldNos(oldNos)
                    .newNos(newNos)
                    .leftWithTc(leftWithTc)
                    .leftWithoutTc(leftWithoutTc)
                    .total(totalStrength)
                    .build());
        }

        return report;
    }

    private boolean tableExists(JdbcTemplate jdbc, String tableName) {
        try {
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
                    Integer.class, tableName);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }
}