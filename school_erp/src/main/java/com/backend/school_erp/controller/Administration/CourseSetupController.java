package com.backend.school_erp.controller.Administration;

import com.backend.school_erp.DTO.Administration.CourseSetupDTO;
import com.backend.school_erp.entity.Administration.CourseSetup;
import com.backend.school_erp.service.Administration.CourseSetupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/administration/courses")
@RequiredArgsConstructor
@Slf4j
public class CourseSetupController {

    private final CourseSetupService courseSetupService;

    /** GET /courses?schoolId=&year= */
    @GetMapping
    public ResponseEntity<List<CourseSetup>> getCourses(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(courseSetupService.getCourses(schoolId, year));
    }

    /** POST /courses */
    @PostMapping
    public ResponseEntity<CourseSetup> addCourse(@RequestBody CourseSetupDTO dto) {
        CourseSetup created = courseSetupService.addCourse(dto.getSchoolId(), dto);
        return ResponseEntity.created(URI.create("/api/administration/courses/" + created.getId()))
                .body(created);
    }

    /** PUT /courses/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @RequestBody CourseSetupDTO dto) {
        return courseSetupService.updateCourse(dto.getSchoolId(), id, dto.getStandard())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** DELETE /courses/{id}?schoolId= */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id, @RequestParam String schoolId) {
        boolean deleted = courseSetupService.deleteCourse(schoolId, id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
