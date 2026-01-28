package com.backend.school_erp.controller.Library;

import com.backend.school_erp.DTO.Library.BookQRCodeDTO;
import com.backend.school_erp.entity.Library.LibraryStock;
import com.backend.school_erp.entity.Library.ItemPurchase;
import com.backend.school_erp.service.Library.BookQRCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/library/qrcode")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Slf4j
public class BookQRCodeController {

    private final BookQRCodeService bookQRCodeService;

    // --- GENERATORS ---
    @GetMapping("/generate")
    public ResponseEntity<Map<String, String>> generateQRCodeNo(
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        String qrCodeNo = bookQRCodeService.generateQRCodeNo(schoolId, academicYear);
        Map<String, String> response = new HashMap<>();
        response.put("qrCodeNo", qrCodeNo);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/generate-book-code")
    public ResponseEntity<Map<String, String>> generateBookCode(
            @RequestParam String schoolId
    ) {
        String bookCode = bookQRCodeService.generateBookCode(schoolId);
        Map<String, String> response = new HashMap<>();
        response.put("bookCode", bookCode);
        return ResponseEntity.ok(response);
    }

    // --- SAVE OPERATIONS ---

    // Save NEW Book (New QR + New Book Code)
    @PostMapping("/save/new")
    public ResponseEntity<?> saveNewQRCodeData(@RequestBody BookQRCodeDTO dto) {
        try {
            // true = treat as new setup (though service now inserts individual records regardless)
            bookQRCodeService.saveQRCodeData(dto, true);
            return ResponseEntity.ok(Map.of("message", "Book Record Saved Successfully!"));
        } catch (Exception e) {
            log.error("Save New Error: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Save EXISTING Book (New QR + Clone/Update)
    @PostMapping("/save/exist")
    public ResponseEntity<?> saveExistingQRCodeData(@RequestBody BookQRCodeDTO dto) {
        try {
            // false = existing flow (service handles this by inserting new stock record)
            bookQRCodeService.saveQRCodeData(dto, false);
            return ResponseEntity.ok(Map.of("message", "Cloned Book Record Saved Successfully!"));
        } catch (Exception e) {
            log.error("Save Existing Error: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- DATA FETCHING ---

    // Fetch single stock record by QR (For Sticker Printing)
    @GetMapping("/stock/by-qr")
    public ResponseEntity<?> getStockByQr(
            @RequestParam String qrCodeNo,
            @RequestParam String schoolId
    ) {
        try {
            LibraryStock stock = bookQRCodeService.getStockByQr(qrCodeNo, schoolId);
            if (stock == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(stock);
        } catch (Exception e) {
            log.error("Error fetching stock by QR: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Fetch all existing books/batches (For Table View & Searching)
    @GetMapping("/existing-books")
    public ResponseEntity<List<LibraryStock>> getExistingBooks(
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        return ResponseEntity.ok(bookQRCodeService.getExistingBooks(schoolId, academicYear));
    }

    // --- ADDITIONAL GETTERS (Legacy/Support) ---

    @GetMapping("/book-details/{bookCode}")
    public ResponseEntity<?> getBookDetails(
            @PathVariable String bookCode,
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        try {
            LibraryStock book = bookQRCodeService.getBookDetails(bookCode, schoolId, academicYear);
            if (book == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(book);
        } catch (Exception e) {
            log.error("Book Details Error: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/book/{bookCode}")
    public ResponseEntity<?> getBookByCode(
            @PathVariable String bookCode,
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        try {
            LibraryStock book = bookQRCodeService.getBookByCode(bookCode, schoolId, academicYear);
            if (book == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(book);
        } catch (Exception e) {
            log.error("Get Book Error: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stocks")
    public ResponseEntity<List<LibraryStock>> getLibraryStocks(
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        return ResponseEntity.ok(bookQRCodeService.getLibraryStocks(schoolId, academicYear));
    }

    @GetMapping("/book/{bookCode}/purchase-history")
    public ResponseEntity<List<ItemPurchase>> getPurchaseHistoryForBook(
            @PathVariable String bookCode,
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        return ResponseEntity.ok(bookQRCodeService.getPurchaseHistoryForBook(bookCode, schoolId, academicYear));
    }

    @GetMapping("/purchases")
    public ResponseEntity<List<ItemPurchase>> getItemPurchases(
            @RequestParam String schoolId,
            @RequestParam String academicYear
    ) {
        return ResponseEntity.ok(bookQRCodeService.getItemPurchases(schoolId, academicYear));
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "QR Code API is working");
        response.put("timestamp", new Date().toString());
        return ResponseEntity.ok(response);
    }
}