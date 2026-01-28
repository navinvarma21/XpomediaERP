package com.backend.school_erp.controller.AdmissionMaster;

import com.backend.school_erp.DTO.AdmissionMaster.ArrearFeeDTO;
import com.backend.school_erp.entity.AdmissionMaster.ArrearFee;
import com.backend.school_erp.service.AdmissionMaster.ArrearFeeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admissionmaster/arrearfee")
@Slf4j
public class ArrearFeeController {

    @Autowired
    private ArrearFeeService arrearFeeService;

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<ArrearFee>> getArrearFeesBySchool(
            @PathVariable String schoolId,
            @RequestParam(required = false) String academicYear) {
        try {
            log.info("Fetching arrear fees for school: {}, academic year: {}", schoolId, academicYear);
            List<ArrearFee> arrearFees = arrearFeeService.getArrearFeesBySchool(schoolId, academicYear);
            return ResponseEntity.ok(arrearFees);
        } catch (Exception e) {
            log.error("Error fetching arrear fees for school {}: {}", schoolId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/school/{schoolId}/admission/{admissionNumber}")
    public ResponseEntity<List<ArrearFee>> getArrearFeesByAdmissionNumber(
            @PathVariable String schoolId,
            @PathVariable String admissionNumber,
            @RequestParam(required = false) String academicYear) {
        try {
            log.info("Fetching arrear fees for admission number: {}, school: {}", admissionNumber, schoolId);
            List<ArrearFee> arrearFees = arrearFeeService.getArrearFeesByAdmissionNumber(schoolId, admissionNumber, academicYear);
            return ResponseEntity.ok(arrearFees);
        } catch (Exception e) {
            log.error("Error fetching arrear fees for admission number {}: {}", admissionNumber, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArrearFee> getArrearFeeById(
            @PathVariable Long id,
            @RequestParam String schoolId) {
        try {
            log.info("Fetching arrear fee by ID: {} for school: {}", id, schoolId);
            Optional<ArrearFee> arrearFee = arrearFeeService.getArrearFeeById(schoolId, id);
            return arrearFee.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching arrear fee by ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<ArrearFee> addArrearFee(
            @RequestBody ArrearFeeDTO arrearFeeDTO,
            @RequestParam String schoolId) {
        try {
            log.info("Adding new arrear fee for school: {}", schoolId);
            ArrearFee savedArrearFee = arrearFeeService.addArrearFee(schoolId, arrearFeeDTO);
            return ResponseEntity.ok(savedArrearFee);
        } catch (Exception e) {
            log.error("Error adding arrear fee: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArrearFee> updateArrearFee(
            @PathVariable Long id,
            @RequestBody ArrearFeeDTO arrearFeeDTO,
            @RequestParam String schoolId) {
        try {
            log.info("Updating arrear fee ID: {} for school: {}", id, schoolId);
            Optional<ArrearFee> updatedArrearFee = arrearFeeService.updateArrearFee(schoolId, id, arrearFeeDTO);
            return updatedArrearFee.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error updating arrear fee ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArrearFee(
            @PathVariable Long id,
            @RequestParam String schoolId) {
        try {
            log.info("Deleting arrear fee ID: {} for school: {}", id, schoolId);
            boolean deleted = arrearFeeService.deleteArrearFee(schoolId, id);
            if (deleted) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting arrear fee ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}