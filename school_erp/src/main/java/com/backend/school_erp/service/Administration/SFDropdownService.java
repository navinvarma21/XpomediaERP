package com.backend.school_erp.service.Administration;

import com.backend.school_erp.DTO.Administration.SFDropdownDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.StateDistrict;
import com.backend.school_erp.entity.Administration.CommunityAndCasteSetup;
import com.backend.school_erp.entity.Administration.StaffDAC;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class SFDropdownService {

    private final Map<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();

    private DataSource getDataSource(String schoolId) {
        return dataSourceCache.computeIfAbsent(schoolId, id -> {
            log.info("Creating HikariCP DataSource for school: {}", id);
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(DatabaseConfig.AWS_DB_BASE_URL + id + DatabaseConfig.DB_PARAMS);
            config.setUsername(DatabaseConfig.AWS_DB_USER);
            config.setPassword(DatabaseConfig.AWS_DB_PASS);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            return new HikariDataSource(config);
        });
    }

    private JdbcTemplate getJdbcTemplate(String schoolId) {
        return new JdbcTemplate(getDataSource(schoolId));
    }

    // Helper for State/District
    private SFDropdownDTO stateDistrictToDTO(StateDistrict entity) {
        SFDropdownDTO.SFDropdownDTOBuilder builder = SFDropdownDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .type(entity.getType());

        if ("state".equalsIgnoreCase(entity.getType())) {
            builder.state(entity.getName());
        } else if ("district".equalsIgnoreCase(entity.getType())) {
            builder.district(entity.getName())
                    .stateId(entity.getStateId());
        }

        return builder.build();
    }

    // Helper for Community/Caste/Religion/Nationality - FIXED
    private SFDropdownDTO communityCasteToDTO(CommunityAndCasteSetup entity) {
        SFDropdownDTO.SFDropdownDTOBuilder builder = SFDropdownDTO.builder()
                .id(entity.getId())
                .name(entity.getName());

        switch (entity.getType().toLowerCase()) {
            case "community":
                builder.community(entity.getName());
                break;
            case "caste":
                builder.caste(entity.getName());
                break;
            case "religion":
                builder.religion(entity.getName());
                break;
            case "nationality":
                builder.nationality(entity.getName());
                break;
        }

        return builder.build();
    }

    // Helper for Staff Designation/Category - FIXED
    private SFDropdownDTO staffDacToDTO(StaffDAC entity) {
        SFDropdownDTO.SFDropdownDTOBuilder builder = SFDropdownDTO.builder()
                .id(entity.getId())
                .name(entity.getName());

        if ("Designation".equalsIgnoreCase(entity.getType())) {
            builder.designation(entity.getName());
        } else if ("Category".equalsIgnoreCase(entity.getType())) {
            builder.category(entity.getName());
        }

        return builder.build();
    }

    // --- States ---
    public List<SFDropdownDTO> getStates(String schoolId, String academicYear) {
        try {
            List<StateDistrict> states = getJdbcTemplate(schoolId).query(
                    "SELECT * FROM state_district WHERE type='state' AND school_id=? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(StateDistrict.class),
                    schoolId
            );
            log.info("Found {} states for school {}", states.size(), schoolId);
            return states.stream().map(this::stateDistrictToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching states for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // --- Districts ---
    public List<SFDropdownDTO> getDistricts(String schoolId, String academicYear) {
        try {
            List<StateDistrict> districts = getJdbcTemplate(schoolId).query(
                    "SELECT * FROM state_district WHERE type='district' AND school_id=? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(StateDistrict.class),
                    schoolId
            );
            log.info("Found {} districts for school {}", districts.size(), schoolId);
            return districts.stream().map(this::stateDistrictToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching districts for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // --- Communities --- FIXED
    public List<SFDropdownDTO> getCommunities(String schoolId, String academicYear) {
        try {
            List<CommunityAndCasteSetup> communities = getJdbcTemplate(schoolId).query(
                    "SELECT * FROM community_caste WHERE type='communities' AND school_id=? AND academic_year=? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(CommunityAndCasteSetup.class),
                    schoolId, academicYear
            );
            log.info("Found {} communities for school {}", communities.size(), schoolId);
            return communities.stream().map(this::communityCasteToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching communities for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // --- Castes --- FIXED
    public List<SFDropdownDTO> getCastes(String schoolId, String academicYear) {
        try {
            List<CommunityAndCasteSetup> castes = getJdbcTemplate(schoolId).query(
                    "SELECT * FROM community_caste WHERE type='castes' AND school_id=? AND academic_year=? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(CommunityAndCasteSetup.class),
                    schoolId, academicYear
            );
            log.info("Found {} castes for school {}", castes.size(), schoolId);
            return castes.stream().map(this::communityCasteToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching castes for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // --- Religions --- FIXED
    public List<SFDropdownDTO> getReligions(String schoolId, String academicYear) {
        try {
            List<CommunityAndCasteSetup> religions = getJdbcTemplate(schoolId).query(
                    "SELECT * FROM community_caste WHERE type='religions' AND school_id=? AND academic_year=? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(CommunityAndCasteSetup.class),
                    schoolId, academicYear
            );
            log.info("Found {} religions for school {}", religions.size(), schoolId);
            return religions.stream().map(this::communityCasteToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching religions for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // --- Nationalities --- FIXED
    public List<SFDropdownDTO> getNationalities(String schoolId, String academicYear) {
        try {
            List<CommunityAndCasteSetup> nationalities = getJdbcTemplate(schoolId).query(
                    "SELECT * FROM community_caste WHERE type='nationalities' AND school_id=? AND academic_year=? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(CommunityAndCasteSetup.class),
                    schoolId, academicYear
            );
            log.info("Found {} nationalities for school {}", nationalities.size(), schoolId);
            return nationalities.stream().map(this::communityCasteToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching nationalities for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // --- Staff Designations --- FIXED
    public List<SFDropdownDTO> getStaffDesignations(String schoolId, String academicYear) {
        try {
            List<StaffDAC> designations = getJdbcTemplate(schoolId).query(
                    "SELECT * FROM staff_dac WHERE type='StaffDesignation' AND school_id=? AND academic_year=? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(StaffDAC.class),
                    schoolId, academicYear
            );
            log.info("Found {} staff designations for school {}", designations.size(), schoolId);
            return designations.stream().map(this::staffDacToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching staff designations for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // --- Staff Categories --- FIXED
    public List<SFDropdownDTO> getStaffCategories(String schoolId, String academicYear) {
        try {
            List<StaffDAC> categories = getJdbcTemplate(schoolId).query(
                    "SELECT * FROM staff_dac WHERE type='StaffCategory' AND school_id=? AND academic_year=? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(StaffDAC.class),
                    schoolId, academicYear
            );
            log.info("Found {} staff categories for school {}", categories.size(), schoolId);
            return categories.stream().map(this::staffDacToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching staff categories for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // --- Courses ---
    public List<SFDropdownDTO> getCourses(String schoolId, String academicYear) {
        try {
            String sql = "SELECT id, standard FROM courses WHERE school_id=? AND academic_year=? ORDER BY standard ASC";
            List<SFDropdownDTO> courses = getJdbcTemplate(schoolId).query(sql, (rs, rowNum) ->
                            SFDropdownDTO.builder()
                                    .id(rs.getLong("id"))
                                    .name(rs.getString("standard"))
                                    .standard(rs.getString("standard"))
                                    .build(),
                    schoolId, academicYear
            );
            log.info("Found {} courses for school {}", courses.size(), schoolId);
            return courses;
        } catch (Exception e) {
            log.error("Error fetching courses for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }
}