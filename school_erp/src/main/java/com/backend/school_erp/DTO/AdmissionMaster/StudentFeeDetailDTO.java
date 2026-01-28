package com.backend.school_erp.DTO.AdmissionMaster;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// 1. Helper DTO for individual fee rows
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentFeeDetailDTO {
    private String feeHeading;
    private String accountHead;
    private Double amount;
}

