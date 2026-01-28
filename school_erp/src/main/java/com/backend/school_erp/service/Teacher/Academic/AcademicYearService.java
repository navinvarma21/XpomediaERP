package com.backend.school_erp.service.Teacher.Academic;

// 1. Import the Centralized Config
import com.backend.school_erp.config.DatabaseConfig;

import com.backend.school_erp.DTO.Teacher.Academic.AcademicYearDTO;
import com.backend.school_erp.DTO.Teacher.Academic.ActiveSessionDTO;
import com.backend.school_erp.DTO.Teacher.Academic.TermDTO;
import com.backend.school_erp.entity.Teacher.Academic.AcademicYear;
import com.backend.school_erp.entity.Teacher.Academic.Section;
import com.backend.school_erp.entity.Teacher.Academic.Term;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class AcademicYearService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        if (!schoolId.matches("^[a-zA-Z0-9_]+$")) {
            throw new IllegalArgumentException("Invalid School ID format");
        }
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            HikariConfig config = new HikariConfig();

            // 2. Swapped local hardcoded strings for Centralized AWS Constants
            // DatabaseConfig.DB_PARAMS handles SSL, Timezone, and PublicKeyRetrieval
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName(DatabaseConfig.JDBC_DRIVER);

            // Pool settings
            config.setMaximumPoolSize(10);
            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    public void ensureTableStructure(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);

        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS academic_years (
                yearId BIGINT AUTO_INCREMENT PRIMARY KEY,
                year VARCHAR(20) NOT NULL UNIQUE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """);

        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS terms (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                academic_year VARCHAR(20) NOT NULL,
                name VARCHAR(100) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'inactive',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_term_year (academic_year, name)
            )
        """);

        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS active_academicyear (
                id INT PRIMARY KEY DEFAULT 1,
                active_year VARCHAR(20),
                active_term_id BIGINT,
                active_section_id BIGINT
            )
        """);

        try {
            jdbc.execute("ALTER TABLE active_academicyear ADD COLUMN active_section_id BIGINT");
        } catch (Exception e) {
            // Column likely exists
        }

        Integer yearCount = jdbc.queryForObject("SELECT COUNT(*) FROM academic_years", Integer.class);
        if (yearCount == 0) {
            int currentYear = LocalDate.now().getYear();
            for (int i = -2; i <= 2; i++) {
                String year = (currentYear + i) + "-" + (currentYear + i + 1);
                jdbc.update("INSERT IGNORE INTO academic_years (year) VALUES (?)", year);
            }
        }
    }

    public List<AcademicYear> getAllAcademicYears(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableStructure(schoolId);
        String sql = "SELECT yearId, year, createdAt FROM academic_years ORDER BY year DESC";
        return jdbc.query(sql, (rs, rowNum) -> {
            AcademicYear ay = new AcademicYear();
            ay.setYearId(rs.getLong("yearId"));
            ay.setYear(rs.getString("year"));
            java.sql.Timestamp ts = rs.getTimestamp("createdAt");
            if (ts != null) ay.setCreatedAt(ts.toLocalDateTime());
            return ay;
        });
    }

    public List<Section> getSectionsForYear(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String sql = "SELECT id, section, academic_year, created_at FROM sections WHERE academic_year = ?";

        return jdbc.query(sql, (rs, rowNum) -> {
            return Section.builder()
                    .id(rs.getLong("id"))
                    .section(rs.getString("section"))
                    .academicYear(rs.getString("academic_year"))
                    .schoolId(schoolId)
                    .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
                    .build();
        }, academicYear);
    }

    public ActiveSessionDTO getActiveSession(String schoolId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableStructure(schoolId);

        String sql = """
            SELECT aa.active_year, aa.active_term_id, aa.active_section_id, 
                   t.name as term_name, s.section as section_name
            FROM active_academicyear aa 
            LEFT JOIN terms t ON aa.active_term_id = t.id 
            LEFT JOIN sections s ON aa.active_section_id = s.id
            LIMIT 1
        """;

        try {
            return jdbc.queryForObject(sql, (rs, rowNum) ->
                    ActiveSessionDTO.builder()
                            .activeYear(rs.getString("active_year"))
                            .activeTermId(rs.getObject("active_term_id") != null ? rs.getLong("active_term_id") : null)
                            .activeTermName(rs.getString("term_name"))
                            .activeSectionId(rs.getObject("active_section_id") != null ? rs.getLong("active_section_id") : null)
                            .activeSectionName(rs.getString("section_name"))
                            .build()
            );
        } catch (Exception e) {
            return ActiveSessionDTO.builder().build();
        }
    }

    public List<Term> getTermsForYear(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableStructure(schoolId);
        Long activeTermId = null;
        try {
            activeTermId = jdbc.queryForObject("SELECT active_term_id FROM active_academicyear LIMIT 1", Long.class);
        } catch (Exception ignored) {}
        final Long finalActiveTermId = activeTermId;
        String sql = "SELECT * FROM terms WHERE academic_year = ? ORDER BY start_date";
        return jdbc.query(sql, (rs, rowNum) -> {
            Term term = new Term();
            term.setId(rs.getLong("id"));
            term.setAcademicYear(rs.getString("academic_year"));
            term.setName(rs.getString("name"));
            term.setStart(rs.getDate("start_date").toLocalDate());
            term.setEnd(rs.getDate("end_date").toLocalDate());
            term.setStatus(rs.getString("status"));
            term.setCurrentActive(finalActiveTermId != null && finalActiveTermId.equals(term.getId()));
            return term;
        }, academicYear);
    }

    public void setActiveSession(String schoolId, String year, Long termId, Long sectionId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableStructure(schoolId);

        Integer yearExists = jdbc.queryForObject("SELECT COUNT(*) FROM academic_years WHERE year = ?", Integer.class, year);
        if (yearExists == 0) {
            jdbc.update("INSERT IGNORE INTO academic_years (year) VALUES (?)", year);
        }

        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM active_academicyear", Integer.class);

        if (count != null && count > 0) {
            jdbc.update("UPDATE active_academicyear SET active_year = ?, active_term_id = ?, active_section_id = ?", year, termId, sectionId);
        } else {
            jdbc.update("INSERT INTO active_academicyear (id, active_year, active_term_id, active_section_id) VALUES (1, ?, ?, ?)", year, termId, sectionId);
        }

        jdbc.update("UPDATE terms SET status = 'inactive'");
        if(termId != null) {
            jdbc.update("UPDATE terms SET status = 'active' WHERE id = ?", termId);
        }
    }

    public void createTerms(String schoolId, AcademicYearDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableStructure(schoolId);
        Integer yearExists = jdbc.queryForObject("SELECT COUNT(*) FROM academic_years WHERE year = ?", Integer.class, dto.getAcademicYear());
        if (yearExists == 0) {
            jdbc.update("INSERT INTO academic_years (year) VALUES (?)", dto.getAcademicYear());
        }
        String sql = "INSERT INTO terms (academic_year, name, start_date, end_date, status) VALUES (?, ?, ?, ?, 'inactive')";
        for (TermDTO t : dto.getTerms()) {
            try {
                jdbc.update(sql, dto.getAcademicYear(), t.getName(), t.getStart(), t.getEnd());
            } catch (Exception e) {
                log.warn("Term {} for year {} already exists", t.getName(), dto.getAcademicYear());
            }
        }
    }

    public void deleteTerm(String schoolId, Long termId) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        Long activeTermId = jdbc.queryForObject("SELECT active_term_id FROM active_academicyear LIMIT 1", Long.class);
        if (activeTermId != null && activeTermId.equals(termId)) {
            throw new IllegalArgumentException("Cannot delete active term. Please set another term as active first.");
        }
        jdbc.update("DELETE FROM terms WHERE id = ?", termId);
    }

    public void updateTerm(String schoolId, Long termId, TermDTO termDTO) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        String sql = "UPDATE terms SET name = ?, start_date = ?, end_date = ? WHERE id = ?";
        jdbc.update(sql, termDTO.getName(), termDTO.getStart(), termDTO.getEnd(), termId);
    }
}