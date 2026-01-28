package com.backend.school_erp.service.Teacher.Login;

import com.backend.school_erp.entity.Teacher.Login.SchoolEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;

@Service
@Slf4j
public class TeacherSchoolService {

    private final JdbcTemplate jdbcTemplate;

    public TeacherSchoolService(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    public SchoolEntity findSchoolByCode(String schoolCode) {
        try {
            String sql = "SELECT * FROM xpo.schools WHERE school_code = ? AND status = 'Active'";
            return jdbcTemplate.queryForObject(sql,
                    new BeanPropertyRowMapper<>(SchoolEntity.class),
                    schoolCode);
        } catch (Exception e) {
            log.error("School not found with code: {}", schoolCode);
            return null;
        }
    }

    public boolean isSchoolActive(SchoolEntity school) {
        return school != null && "Active".equals(school.getStatus());
    }
}