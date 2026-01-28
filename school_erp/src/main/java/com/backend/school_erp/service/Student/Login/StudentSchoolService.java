package com.backend.school_erp.service.Student.Login;

import com.backend.school_erp.entity.Student.Login.SSchoolEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;

@Service
@Slf4j
public class StudentSchoolService {

    private final JdbcTemplate jdbcTemplate;

    public StudentSchoolService(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    public SSchoolEntity findSchoolByCode(String schoolCode) {
        try {
            String sql = "SELECT * FROM xpo.schools WHERE school_code = ? AND status = 'Active'";
            return jdbcTemplate.queryForObject(sql,
                    new BeanPropertyRowMapper<>(SSchoolEntity.class),
                    schoolCode);
        } catch (Exception e) {
            log.error("School not found with code: {}", schoolCode);
            return null;
        }
    }

    public boolean isSchoolActive(SSchoolEntity school) {
        return school != null && "Active".equals(school.getStatus());
    }
}