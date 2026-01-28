package com.backend.school_erp.DTO.Transaction;

import lombok.Data;

@Data
public class DuplicateBillResponseDTO {
    private boolean success;
    private Object data;
    private String message;
    private String error;

    public static DuplicateBillResponseDTO success(Object data) {
        DuplicateBillResponseDTO response = new DuplicateBillResponseDTO();
        response.setSuccess(true);
        response.setData(data);
        response.setMessage("Bill data retrieved successfully");
        return response;
    }

    public static DuplicateBillResponseDTO success(Object data, String message) {
        DuplicateBillResponseDTO response = new DuplicateBillResponseDTO();
        response.setSuccess(true);
        response.setData(data);
        response.setMessage(message);
        return response;
    }

    public static DuplicateBillResponseDTO error(String errorMessage) {
        DuplicateBillResponseDTO response = new DuplicateBillResponseDTO();
        response.setSuccess(false);
        response.setError(errorMessage);
        response.setMessage("Failed to retrieve bill data");
        return response;
    }
}