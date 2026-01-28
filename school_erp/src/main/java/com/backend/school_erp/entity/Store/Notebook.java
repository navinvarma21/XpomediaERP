package com.backend.school_erp.entity.Store;

import lombok.Data;
import java.time.LocalDate;

@Data
public class Notebook {
    private Long id;
    private String billNo;        // The generated Bill Number (e.g., NB-2023-0001)
    private String billNum;       // Same as billNo used for searching
    private LocalDate feeDate;
    private int quantity;
    private double totalAmount;   // Line total (qty * rate)
    private String admissionNo;   // Stored as 'regNo'
    private String operatorNo;    // The logged-in user
    private String descriptionName; // Item Name
    private String studentName;
    private String standard;
    private String section;
    private String schoolId;
    private String academicYear;
}