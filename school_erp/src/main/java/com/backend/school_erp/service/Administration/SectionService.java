package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.SectionDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.Section;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class SectionService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("🔗 Creating HikariCP DataSource for school: {}", id);
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            config.setMaximumPoolSize(10);
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

    private void ensureTableExists(JdbcTemplate jdbc) {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS sections (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                section VARCHAR(50) NOT NULL,          -- renamed column
                school_id VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_section (section, school_id, academic_year)
            )
        """);
    }

    public List<Section> getSections(String schoolId, String academicYear) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);
        return jdbc.query(
                "SELECT * FROM sections WHERE school_id = ? AND academic_year = ? ORDER BY id DESC",
                new BeanPropertyRowMapper<>(Section.class),
                schoolId, academicYear
        );
    }

    public Section addSection(String schoolId, SectionDTO dto) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        try {
            jdbc.update(
                    "INSERT INTO sections (section, school_id, academic_year) VALUES (?, ?, ?)",
                    dto.getSection(), schoolId, dto.getAcademicYear()
            );
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Section already exists: " + dto.getSection());
        }

        Long lastId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return Section.builder()
                .id(lastId)
                .section(dto.getSection())
                .schoolId(schoolId)
                .academicYear(dto.getAcademicYear())
                .build();
    }

    public Section updateSection(String schoolId, Long id, String sectionName) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("UPDATE sections SET section = ? WHERE id = ?", sectionName, id);
        if (rows == 0) throw new RuntimeException("Section not found with id " + id);

        return jdbc.queryForObject(
                "SELECT * FROM sections WHERE id = ?",
                new BeanPropertyRowMapper<>(Section.class),
                id
        );
    }

    public void deleteSection(String schoolId, Long id) {
        JdbcTemplate jdbc = getJdbcTemplate(schoolId);
        ensureTableExists(jdbc);

        int rows = jdbc.update("DELETE FROM sections WHERE id = ?", id);
        if (rows == 0) throw new RuntimeException("Section not found with id " + id);
    }
}
