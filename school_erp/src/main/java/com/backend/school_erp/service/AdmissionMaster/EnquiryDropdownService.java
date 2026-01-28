package com.backend.school_erp.service.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.EnquiryDropdownDTO;
import com.backend.school_erp.DTO.AdmissionMaster.FeeDetailDTO;
import com.backend.school_erp.config.DatabaseConfig;
import com.backend.school_erp.entity.Administration.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Service
@Slf4j
public class EnquiryDropdownService {

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

    /**
     * Helper method to resolve academic year.
     * If providedYear is null/empty, fetches the latest academic year from the DB (using sections table as reference).
     */
    private String resolveAcademicYear(String schoolId, String providedYear) {
        if (providedYear != null && !providedYear.isEmpty() && !providedYear.equals("undefined")) {
            return providedYear;
        }
        try {
            // Fallback: Fetch the latest academic year from sections table (assuming it contains recent data)
            String sql = "SELECT academic_year FROM sections WHERE school_id = ? ORDER BY id DESC LIMIT 1";
            return getJdbcTemplate(schoolId).queryForObject(sql, String.class, schoolId);
        } catch (EmptyResultDataAccessException e) {
            log.warn("No academic year found in sections table for school {}", schoolId);
            return ""; // Return empty or handle as needed
        } catch (Exception e) {
            log.error("Error resolving academic year for school {}: {}", schoolId, e.getMessage());
            return "";
        }
    }

    // States (Global)
    public List<EnquiryDropdownDTO> getStates(String schoolId) {
        try {
            List<StateDistrict> states = getJdbcTemplate(schoolId).query(
                    "SELECT id, name, type, state_id, school_id, created_at FROM state_district WHERE type='state' AND school_id = ? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(StateDistrict.class),
                    schoolId
            );
            return states.stream().map(state ->
                    EnquiryDropdownDTO.builder()
                            .id(state.getId())
                            .name(state.getName())
                            .state(state.getName())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching states for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Districts (Global)
    public List<EnquiryDropdownDTO> getDistricts(String schoolId) {
        try {
            List<StateDistrict> districts = getJdbcTemplate(schoolId).query(
                    "SELECT id, name, type, state_id, school_id, created_at FROM state_district WHERE type='district' AND school_id = ? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(StateDistrict.class),
                    schoolId
            );
            return districts.stream().map(district ->
                    EnquiryDropdownDTO.builder()
                            .id(district.getId())
                            .name(district.getName())
                            .district(district.getName())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching districts for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Districts by State (Global)
    public List<EnquiryDropdownDTO> getDistrictsByState(String schoolId, Long stateId) {
        try {
            List<StateDistrict> districts = getJdbcTemplate(schoolId).query(
                    "SELECT id, name, type, state_id, school_id, created_at FROM state_district WHERE type='district' AND state_id = ? AND school_id = ? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(StateDistrict.class),
                    stateId, schoolId
            );
            return districts.stream().map(district ->
                    EnquiryDropdownDTO.builder()
                            .id(district.getId())
                            .name(district.getName())
                            .district(district.getName())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching districts for state {} in school {}: {}", stateId, schoolId, e.getMessage());
            return List.of();
        }
    }

    // Communities
    public List<EnquiryDropdownDTO> getCommunities(String schoolId, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            List<CommunityAndCasteSetup> communities = getJdbcTemplate(schoolId).query(
                    "SELECT id, name, type, school_id, academic_year, created_at FROM community_caste WHERE type='communities' AND school_id = ? AND academic_year = ? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(CommunityAndCasteSetup.class),
                    schoolId, year
            );
            return communities.stream().map(community ->
                    EnquiryDropdownDTO.builder()
                            .id(community.getId())
                            .name(community.getName())
                            .community(community.getName())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching communities for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Castes
    public List<EnquiryDropdownDTO> getCastes(String schoolId, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            List<CommunityAndCasteSetup> castes = getJdbcTemplate(schoolId).query(
                    "SELECT id, name, type, school_id, academic_year, created_at FROM community_caste WHERE type='castes' AND school_id = ? AND academic_year = ? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(CommunityAndCasteSetup.class),
                    schoolId, year
            );
            return castes.stream().map(caste ->
                    EnquiryDropdownDTO.builder()
                            .id(caste.getId())
                            .name(caste.getName())
                            .caste(caste.getName())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching castes for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Religions
    public List<EnquiryDropdownDTO> getReligions(String schoolId, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            List<CommunityAndCasteSetup> religions = getJdbcTemplate(schoolId).query(
                    "SELECT id, name, type, school_id, academic_year, created_at FROM community_caste WHERE type='religions' AND school_id = ? AND academic_year = ? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(CommunityAndCasteSetup.class),
                    schoolId, year
            );
            return religions.stream().map(religion ->
                    EnquiryDropdownDTO.builder()
                            .id(religion.getId())
                            .name(religion.getName())
                            .religion(religion.getName())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching religions for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Nationalities
    public List<EnquiryDropdownDTO> getNationalities(String schoolId, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            List<CommunityAndCasteSetup> nationalities = getJdbcTemplate(schoolId).query(
                    "SELECT id, name, type, school_id, academic_year, created_at FROM community_caste WHERE type='nationalities' AND school_id = ? AND academic_year = ? ORDER BY name ASC",
                    new BeanPropertyRowMapper<>(CommunityAndCasteSetup.class),
                    schoolId, year
            );
            return nationalities.stream().map(nationality ->
                    EnquiryDropdownDTO.builder()
                            .id(nationality.getId())
                            .name(nationality.getName())
                            .nationality(nationality.getName())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching nationalities for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Sections
    public List<EnquiryDropdownDTO> getSections(String schoolId, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            List<Section> sections = getJdbcTemplate(schoolId).query(
                    "SELECT id, section, school_id, academic_year FROM sections WHERE school_id = ? AND academic_year = ? ORDER BY section ASC",
                    new BeanPropertyRowMapper<>(Section.class),
                    schoolId, year
            );
            return sections.stream().map(section ->
                    EnquiryDropdownDTO.builder()
                            .id(section.getId())
                            .name(section.getSection())
                            .section(section.getSection())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching sections for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Mother Tongues
    public List<EnquiryDropdownDTO> getMotherTongues(String schoolId, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            List<MotherTongueSetup> motherTongues = getJdbcTemplate(schoolId).query(
                    "SELECT id, mother_tongue, school_id, academic_year FROM mother_tongues WHERE school_id = ? AND academic_year = ? ORDER BY mother_tongue ASC",
                    new BeanPropertyRowMapper<>(MotherTongueSetup.class),
                    schoolId, year
            );
            return motherTongues.stream().map(mt ->
                    EnquiryDropdownDTO.builder()
                            .id(mt.getId())
                            .name(mt.getMotherTongue())
                            .motherTongue(mt.getMotherTongue())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching mother tongues for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Student Categories
    public List<EnquiryDropdownDTO> getStudentCategories(String schoolId, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            List<StudentCategory> studentCategories = getJdbcTemplate(schoolId).query(
                    "SELECT id, student_category_name, school_id, academic_year, created_at FROM student_categories WHERE school_id = ? AND academic_year = ? ORDER BY student_category_name ASC",
                    new BeanPropertyRowMapper<>(StudentCategory.class),
                    schoolId, year
            );
            return studentCategories.stream().map(category ->
                    EnquiryDropdownDTO.builder()
                            .id(category.getId())
                            .name(category.getStudentCategoryName())
                            .studentCategory(category.getStudentCategoryName())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching student categories for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Courses (Standards)
    public List<EnquiryDropdownDTO> getCourses(String schoolId, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            List<CourseSetup> courses = getJdbcTemplate(schoolId).query(
                    "SELECT id, standard, school_id, academic_year FROM courses WHERE school_id = ? AND academic_year = ? ORDER BY standard ASC",
                    new BeanPropertyRowMapper<>(CourseSetup.class),
                    schoolId, year
            );
            return courses.stream().map(course ->
                    EnquiryDropdownDTO.builder()
                            .id(course.getId())
                            .name(course.getStandard())
                            .standard(course.getStandard())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching courses for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Parent Occupations
    public List<EnquiryDropdownDTO> getParentOccupations(String schoolId, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            List<ParentOccupationSetup> occupations = getJdbcTemplate(schoolId).query(
                    "SELECT id, occupation, school_id, academic_year, created_at FROM parent_occupations WHERE school_id = ? AND academic_year = ? ORDER BY occupation ASC",
                    new BeanPropertyRowMapper<>(ParentOccupationSetup.class),
                    schoolId, year
            );
            return occupations.stream().map(occupation ->
                    EnquiryDropdownDTO.builder()
                            .id(occupation.getId())
                            .name(occupation.getOccupation())
                            .parentOccupation(occupation.getOccupation())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching parent occupations for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Blood Groups
    public List<EnquiryDropdownDTO> getBloodGroups(String schoolId, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            List<BloodGroupSetup> bloodGroups = getJdbcTemplate(schoolId).query(
                    "SELECT id, blood_group, school_id, academic_year FROM blood_groups WHERE school_id = ? AND academic_year = ? ORDER BY blood_group ASC",
                    new BeanPropertyRowMapper<>(BloodGroupSetup.class),
                    schoolId, year
            );
            return bloodGroups.stream().map(bg ->
                    EnquiryDropdownDTO.builder()
                            .id(bg.getId())
                            .name(bg.getBloodGroup())
                            .bloodGroup(bg.getBloodGroup())
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching blood groups for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Bus Fees
    public List<EnquiryDropdownDTO> getBusFees(String schoolId, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            String checkTableSql = "SHOW TABLES LIKE 'bus_fees'";
            List<String> tables = getJdbcTemplate(schoolId).query(checkTableSql, (rs, rowNum) -> rs.getString(1));

            if (tables.isEmpty()) {
                log.warn("bus_fees table does not exist in school database: {}", schoolId);
                return List.of();
            }

            String sql = "SELECT id, boarding_point, route_number, fee_heading, account_head, fee, school_id, academic_year " +
                    "FROM bus_fees WHERE school_id = ? AND academic_year = ? ORDER BY boarding_point, route_number ASC";

            return getJdbcTemplate(schoolId).query(sql, (rs, rowNum) ->
                    EnquiryDropdownDTO.builder()
                            .id(rs.getLong("id"))
                            .boardingPoint(rs.getString("boarding_point"))
                            .route(rs.getString("route_number"))
                            .name(rs.getString("fee_heading"))
                            .feeHead(rs.getString("fee_heading"))
                            .amount(rs.getDouble("fee"))
                            .type("BUS")
                            .build(), schoolId, year);
        } catch (Exception e) {
            log.error("Error fetching bus fees for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // Hostel Fee Heads
    public List<EnquiryDropdownDTO> getHostelFeeHeads(String schoolId, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            List<HostelFeeSetup> feeHeads = getJdbcTemplate(schoolId).query(
                    "SELECT id, fee_heading, fee_amount, school_id, academic_year FROM hostel_fee_heads WHERE school_id = ? AND academic_year = ? ORDER BY fee_heading ASC",
                    new BeanPropertyRowMapper<>(HostelFeeSetup.class),
                    schoolId, year
            );
            return feeHeads.stream().map(feeHead ->
                    EnquiryDropdownDTO.builder()
                            .id(feeHead.getId())
                            .name(feeHead.getFeeHeading())
                            .feeHead(feeHead.getFeeHeading())
                            .amount(feeHead.getFeeAmount() != null ? feeHead.getFeeAmount().doubleValue() : 0.0)
                            .type("HOSTEL")
                            .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching hostel fee heads for school {}: {}", schoolId, e.getMessage());
            return List.of();
        }
    }

    // TUITION FEES
    public List<FeeDetailDTO> getAllFees(String schoolId, String standard, String studentCategory, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            log.info("Fetching all tuition fees for school: {}, standard: {}, category: {}, year: {}", schoolId, standard, studentCategory, year);

            String checkTableSql = "SHOW TABLES LIKE 'tuition_fees'";
            List<String> tables = getJdbcTemplate(schoolId).query(checkTableSql, (rs, rowNum) -> rs.getString(1));

            if (tables.isEmpty()) {
                log.warn("tuition_fees table does not exist in school database: {}", schoolId);
                return List.of();
            }

            String sql = "SELECT id, standard, student_category, " +
                    "fee_heading, account_head, fee_amount, school_id, academic_year, created_at " +
                    "FROM tuition_fees " +
                    "WHERE school_id = ? AND standard = ? AND student_category = ? AND academic_year = ? " +
                    "ORDER BY fee_heading ASC";

            return getJdbcTemplate(schoolId).query(
                    sql,
                    (rs, rowNum) -> FeeDetailDTO.builder()
                            .id(rs.getLong("id"))
                            .standard(rs.getString("standard"))
                            .studentCategory(rs.getString("student_category"))
                            .feeHeading(rs.getString("fee_heading"))
                            .accountHead(rs.getString("account_head"))
                            .amount(rs.getBigDecimal("fee_amount"))
                            .feeAmount(rs.getBigDecimal("fee_amount") != null ? rs.getBigDecimal("fee_amount").toString() : "0.00")
                            .schoolId(rs.getString("school_id"))
                            .academicYear(rs.getString("academic_year"))
                            .type("TUITION")
                            .build(),
                    schoolId, standard, studentCategory, year
            );

        } catch (Exception e) {
            log.error("Error fetching tuition fees for school {}, standard {}, category {}, year {}: {}",
                    schoolId, standard, studentCategory, year, e.getMessage());
            return List.of();
        }
    }

    // HOSTEL FEES
    public List<FeeDetailDTO> getHostelFees(String schoolId, String standard, String studentCategory, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            log.info("Fetching hostel fees for school: {}, standard: {}, category: {}, year: {}", schoolId, standard, studentCategory, year);

            String checkTableSql = "SHOW TABLES LIKE 'hostel_fees'";
            List<String> tables = getJdbcTemplate(schoolId).query(checkTableSql, (rs, rowNum) -> rs.getString(1));

            if (tables.isEmpty()) {
                log.warn("hostel_fees table does not exist in school database: {}", schoolId);
                return List.of();
            }

            String sql = "SELECT id, standard, student_category, " +
                    "fee_heading, account_head, fee_amount, school_id, academic_year, created_at " +
                    "FROM hostel_fees " +
                    "WHERE school_id = ? AND standard = ? AND student_category = ? AND academic_year = ? " +
                    "ORDER BY fee_heading ASC";

            return getJdbcTemplate(schoolId).query(
                    sql,
                    (rs, rowNum) -> FeeDetailDTO.builder()
                            .id(rs.getLong("id"))
                            .standard(rs.getString("standard"))
                            .studentCategory(rs.getString("student_category"))
                            .feeHeading(rs.getString("fee_heading"))
                            .accountHead(rs.getString("account_head"))
                            .amount(rs.getBigDecimal("fee_amount"))
                            .feeAmount(rs.getBigDecimal("fee_amount") != null ? rs.getBigDecimal("fee_amount").toString() : "0.00")
                            .schoolId(rs.getString("school_id"))
                            .academicYear(rs.getString("academic_year"))
                            .type("HOSTEL")
                            .build(),
                    schoolId, standard, studentCategory, year
            );

        } catch (Exception e) {
            log.error("Error fetching hostel fees for school {}, standard {}, category {}, year {}: {}",
                    schoolId, standard, studentCategory, year, e.getMessage());
            return List.of();
        }
    }

    // BUS FEE
    public FeeDetailDTO getBusFee(String schoolId, String boardingPoint, String routeNumber, String academicYear) {
        String year = resolveAcademicYear(schoolId, academicYear);
        try {
            log.info("Fetching bus fee for school: {}, boarding point: {}, route: {}, year: {}", schoolId, boardingPoint, routeNumber, year);

            String checkTableSql = "SHOW TABLES LIKE 'bus_fees'";
            List<String> tables = getJdbcTemplate(schoolId).query(checkTableSql, (rs, rowNum) -> rs.getString(1));

            if (tables.isEmpty()) {
                log.warn("bus_fees table does not exist in school database: {}", schoolId);
                return createDefaultBusFeeDTO();
            }

            String sql = "SELECT id, boarding_point, route_number, fee_heading, account_head, fee, school_id, academic_year " +
                    "FROM bus_fees " +
                    "WHERE school_id = ? AND boarding_point = ? AND route_number = ? AND academic_year = ? " +
                    "LIMIT 1";

            List<FeeDetailDTO> busFees = getJdbcTemplate(schoolId).query(sql, (rs, rowNum) ->
                            FeeDetailDTO.builder()
                                    .id(rs.getLong("id"))
                                    .feeHeading(rs.getString("fee_heading"))
                                    .accountHead(rs.getString("account_head"))
                                    .amount(rs.getBigDecimal("fee"))
                                    .feeAmount(rs.getBigDecimal("fee") != null ? rs.getBigDecimal("fee").toString() : "0.00")
                                    .schoolId(rs.getString("school_id"))
                                    .academicYear(rs.getString("academic_year"))
                                    .type("BUS")
                                    .build(),
                    schoolId, boardingPoint, routeNumber, year);

            if (!busFees.isEmpty()) {
                log.info("Found bus fee: {} for boarding point: {}, route: {}", busFees.get(0).getAmount(), boardingPoint, routeNumber);
                return busFees.get(0);
            } else {
                log.warn("No bus fee found for boarding point: {}, route: {}", boardingPoint, routeNumber);
                return createDefaultBusFeeDTO();
            }

        } catch (Exception e) {
            log.error("Error fetching bus fee for school {}, boarding point {}, route {}, year {}: {}",
                    schoolId, boardingPoint, routeNumber, year, e.getMessage());
            return createDefaultBusFeeDTO();
        }
    }

    private FeeDetailDTO createDefaultBusFeeDTO() {
        return FeeDetailDTO.builder()
                .feeHeading("Bus Fee")
                .amount(new BigDecimal("0.00"))
                .feeAmount("0.00")
                .type("BUS")
                .build();
    }
}