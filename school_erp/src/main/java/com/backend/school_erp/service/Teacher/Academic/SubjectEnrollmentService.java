package com.backend.school_erp.service.Teacher.Academic;

// 1. Import the Centralized Config
import com.backend.school_erp.config.DatabaseConfig;

import com.backend.school_erp.DTO.Teacher.Academic.SubjectEnrollmentDTO;
import com.backend.school_erp.entity.Teacher.Academic.SubjectEnrollmentEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.ArrayList;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class SubjectEnrollmentService {

    /** Cache of DataSources per school */
    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating HikariCP DataSource for school: {}", id);
            HikariConfig config = new HikariConfig();

            // 2. Updated to use centralized AWS RDS constants
            // DatabaseConfig.DB_PARAMS includes SSL and Timezone settings
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName(DatabaseConfig.JDBC_DRIVER);

            // Pool settings
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);
            config.setConnectionTimeout(10000);

            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    /**
     * Creates the normalized table.
     */
    private void ensureTableExists(JdbcTemplate jdbc) {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS subject_enrollment (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                term VARCHAR(50) NOT NULL,
                standard VARCHAR(50) NOT NULL,
                section VARCHAR(50),
                subject_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_subject_entry (school_id, academic_year, term, standard, section, subject_name)
            )
        """);
    }

    /**
     * GET: Fetches rows from DB and aggregates them.
     */
    public SubjectEnrollmentDTO getSubjects(String schoolId, String academicYear, String term, String standard, String section) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = "SELECT subject_name FROM subject_enrollment WHERE school_id = ? AND academic_year = ? AND term = ? AND standard = ? AND (section = ? OR section IS NULL)";

        List<String> subjects = jdbc.queryForList(sql, String.class, schoolId, academicYear, term, standard, section);

        return SubjectEnrollmentDTO.builder()
                .schoolId(schoolId)
                .academicYear(academicYear)
                .term(term)
                .standard(standard)
                .section(section)
                .subjects(subjects)
                .build();
    }

    /**
     * SAVE: Batch inserts individual rows using INSERT IGNORE.
     */
    @Transactional
    public void saveSubjects(String schoolId, SubjectEnrollmentDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        String sql = "INSERT IGNORE INTO subject_enrollment (school_id, academic_year, term, standard, section, subject_name) VALUES (?, ?, ?, ?, ?, ?)";

        List<Object[]> batchArgs = new ArrayList<>();
        for (String subject : dto.getSubjects()) {
            batchArgs.add(new Object[]{
                    schoolId,
                    dto.getAcademicYear(),
                    dto.getTerm(),
                    dto.getStandard(),
                    dto.getSection(),
                    subject.trim()
            });
        }

        jdbc.batchUpdate(sql, batchArgs);
    }

    /**
     * UPDATE: Syncs the DB rows with the incoming list.
     */
    @Transactional
    public void updateSubjects(String schoolId, SubjectEnrollmentDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        if (dto.getSubjects() == null || dto.getSubjects().isEmpty()) {
            jdbc.update("DELETE FROM subject_enrollment WHERE school_id = ? AND academic_year = ? AND term = ? AND standard = ? AND (section = ? OR section IS NULL)",
                    schoolId, dto.getAcademicYear(), dto.getTerm(), dto.getStandard(), dto.getSection());
        } else {
            String deleteSql = """
                DELETE FROM subject_enrollment 
                WHERE school_id = ? 
                AND academic_year = ? 
                AND term = ? 
                AND standard = ? 
                AND (section = ? OR section IS NULL)
                AND subject_name NOT IN (%s)
            """;

            String placeHolders = String.join(",", java.util.Collections.nCopies(dto.getSubjects().size(), "?"));
            String finalDeleteSql = String.format(deleteSql, placeHolders);

            List<Object> args = new ArrayList<>();
            args.add(schoolId);
            args.add(dto.getAcademicYear());
            args.add(dto.getTerm());
            args.add(dto.getStandard());
            args.add(dto.getSection());
            args.addAll(dto.getSubjects());

            jdbc.update(finalDeleteSql, args.toArray());
        }

        saveSubjects(schoolId, dto);
    }
}