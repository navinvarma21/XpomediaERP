package com.backend.school_erp.entity.Store;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class NotebookPayDetails {
    private Long id;
    private double totalAmountPaid; // Gross Total of the bill
    private double concessionAmount; // Stored separately
    private String admissionNo;
    private String billNo;
    private String studentName;
    private String standard;
    private String section;
    private String paymode;
    private String ddcheckNo;
    private LocalDate billDate;
    private LocalTime billTime;
    private String schoolId;
    private String academicYear;
}