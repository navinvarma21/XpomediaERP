package com.backend.school_erp.controller.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.CourseWiseFeeDTO;
import com.backend.school_erp.DTO.AdmissionMaster.IndividualFeeDTO;
import com.backend.school_erp.entity.AdmissionMaster.CourseWiseFee;
import com.backend.school_erp.entity.AdmissionMaster.IndividualFee;
import com.backend.school_erp.service.AdmissionMaster.CourseWiseFeeService;
import com.backend.school_erp.service.AdmissionMaster.IndividualFeeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admissionmaster/demandreoprt")
@Slf4j
public class DemandReportController {

    @Autowired
    private CourseWiseFeeService courseWiseFeeService;

    @Autowired
    private IndividualFeeService individualFeeService;

    // Course-wise fees endpoints
    @GetMapping("/coursewise")
    public ResponseEntity<List<CourseWiseFee>> getCourseWiseFees(
            @RequestParam String schoolId,
            @RequestParam(required = false) String academicYear) {
        try {
            List<CourseWiseFee> fees = courseWiseFeeService.getCourseWiseFeesBySchool(schoolId, academicYear);
            return ResponseEntity.ok(fees);
        } catch (Exception e) {
            log.error("Error fetching course-wise fees for school {}: {}", schoolId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/coursewise")
    public ResponseEntity<?> addCourseWiseFee(
            @RequestParam String schoolId,
            @RequestBody CourseWiseFeeDTO dto) {
        try {
            CourseWiseFee fee = courseWiseFeeService.addCourseWiseFee(schoolId, dto);
            return ResponseEntity.ok(fee);
        } catch (Exception e) {
            log.error("Error adding course-wise fee: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/coursewise/{id}")
    public ResponseEntity<?> updateCourseWiseFee(
            @PathVariable Long id,
            @RequestParam String schoolId,
            @RequestBody CourseWiseFeeDTO dto) {
        try {
            Optional<CourseWiseFee> updatedFee = courseWiseFeeService.updateCourseWiseFee(schoolId, id, dto);
            if (updatedFee.isPresent()) {
                return ResponseEntity.ok(updatedFee.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error updating course-wise fee ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/coursewise/{id}")
    public ResponseEntity<?> deleteCourseWiseFee(
            @PathVariable Long id,
            @RequestParam String schoolId) {
        try {
            boolean deleted = courseWiseFeeService.deleteCourseWiseFee(schoolId, id);
            if (deleted) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting course-wise fee ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Individual fees endpoints
    @GetMapping("/individual")
    public ResponseEntity<List<IndividualFee>> getIndividualFees(
            @RequestParam String schoolId,
            @RequestParam(required = false) String academicYear) {
        try {
            List<IndividualFee> fees = individualFeeService.getIndividualFeesBySchool(schoolId, academicYear);
            return ResponseEntity.ok(fees);
        } catch (Exception e) {
            log.error("Error fetching individual fees for school {}: {}", schoolId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/individual/{admissionNumber}")
    public ResponseEntity<List<IndividualFee>> getIndividualFeesByAdmissionNumber(
            @PathVariable String admissionNumber,
            @RequestParam String schoolId,
            @RequestParam(required = false) String academicYear) {
        try {
            List<IndividualFee> fees = individualFeeService.getIndividualFeesByAdmissionNumber(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(fees);
        } catch (Exception e) {
            log.error("Error fetching individual fees for admission number {}: {}", admissionNumber, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/individual")
    public ResponseEntity<?> addIndividualFee(
            @RequestParam String schoolId,
            @RequestBody IndividualFeeDTO dto) {
        try {
            IndividualFee fee = individualFeeService.addIndividualFee(schoolId, dto);
            return ResponseEntity.ok(fee);
        } catch (Exception e) {
            log.error("Error adding individual fee: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/individual/{id}")
    public ResponseEntity<?> updateIndividualFee(
            @PathVariable Long id,
            @RequestParam String schoolId,
            @RequestBody IndividualFeeDTO dto) {
        try {
            Optional<IndividualFee> updatedFee = individualFeeService.updateIndividualFee(schoolId, id, dto);
            if (updatedFee.isPresent()) {
                return ResponseEntity.ok(updatedFee.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error updating individual fee ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/individual/{id}")
    public ResponseEntity<?> deleteIndividualFee(
            @PathVariable Long id,
            @RequestParam String schoolId) {
        try {
            boolean deleted = individualFeeService.deleteIndividualFee(schoolId, id);
            if (deleted) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting individual fee ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}