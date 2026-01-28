package com.backend.school_erp.controller.Library;

import com.backend.school_erp.DTO.Library.BookDetailDTO;
import com.backend.school_erp.entity.Library.BookDetail;
import com.backend.school_erp.service.Library.BookDetailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.net.URI;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/library")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Slf4j
public class BookDetailController {

    private final BookDetailService bookDetailService;

    // New endpoint to generate auto Book ID
    @GetMapping("/generate-book-id")
    public ResponseEntity<Map<String, String>> generateBookId(
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear
    ) {
        try {
            String bookId = bookDetailService.generateBookId(schoolId, academicYear);
            Map<String, String> response = new HashMap<>();
            response.put("bookId", bookId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to generate book ID: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate Book ID"));
        }
    }

    @PostMapping
    public ResponseEntity<BookDetail> addBookDetail(
            @RequestParam(value = "bookId", required = false) String bookId, // Made optional for auto-generation
            @RequestParam(value = "isbn", required = false) String isbn,
            @RequestParam(value = "bookCoverPhoto", required = false) MultipartFile bookCoverPhoto,
            @RequestParam("bookTitle") String bookTitle,
            @RequestParam("authorName") String authorName,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "edition", required = false) String edition,
            @RequestParam(value = "publisher", required = false) String publisher,
            @RequestParam("totalCopies") Integer totalCopies,
            @RequestParam(value = "availableCopies", required = false) Integer availableCopies,
            @RequestParam(value = "bookStatus", required = false) String bookStatus,
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear,
            @RequestParam(value = "language", required = false) String language,
            @RequestParam(value = "pages", required = false) Integer pages,
            @RequestParam(value = "publishedDate", required = false) String publishedDate,
            @RequestParam(value = "description", required = false) String description,

            // New pricing parameters
            @RequestParam(value = "purchaseRate", required = false) BigDecimal purchaseRate,
            @RequestParam(value = "sellingRate", required = false) BigDecimal sellingRate,
            @RequestParam(value = "mrp", required = false) BigDecimal mrp
    ) {
        try {
            BookDetailDTO dto = BookDetailDTO.builder()
                    .bookId(bookId)
                    .isbn(isbn)
                    .bookTitle(bookTitle)
                    .authorName(authorName)
                    .category(category)
                    .edition(edition)
                    .publisher(publisher)
                    .totalCopies(totalCopies)
                    .availableCopies(availableCopies)
                    .bookStatus(bookStatus)
                    .schoolId(schoolId)
                    .academicYear(academicYear)
                    .language(language)
                    .pages(pages)
                    .publishedDate(publishedDate)
                    .description(description)

                    // New pricing fields
                    .purchaseRate(purchaseRate)
                    .sellingRate(sellingRate)
                    .mrp(mrp)

                    .build();

            byte[] coverPhotoBytes = null;
            if (bookCoverPhoto != null && !bookCoverPhoto.isEmpty()) {
                coverPhotoBytes = bookCoverPhoto.getBytes();
            }

            BookDetail created = bookDetailService.addBookDetail(schoolId, dto, coverPhotoBytes);
            return ResponseEntity.created(URI.create("/api/library/" + created.getId()))
                    .body(created);
        } catch (Exception e) {
            log.error("Failed to add book detail: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<BookDetailDTO>> getAllBooks(
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear,
            @RequestParam(value = "search", required = false) String searchTerm
    ) {
        try {
            List<BookDetail> books;

            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                books = bookDetailService.searchBooks(schoolId, academicYear, searchTerm);
            } else {
                books = bookDetailService.getAllBooks(schoolId, academicYear);
            }

            List<BookDetailDTO> bookDTOs = books.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(bookDTOs);
        } catch (Exception e) {
            log.error("Failed to fetch books: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDetailDTO> getBookById(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId
    ) {
        try {
            BookDetail book = bookDetailService.getBookById(schoolId, id);
            return ResponseEntity.ok(convertToDTO(book));
        } catch (RuntimeException e) {
            log.error("Book not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to fetch book: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookDetail> updateBookDetail(
            @PathVariable Long id,
            @RequestParam("bookId") String bookId,
            @RequestParam(value = "isbn", required = false) String isbn,
            @RequestParam(value = "bookCoverPhoto", required = false) MultipartFile bookCoverPhoto,
            @RequestParam("bookTitle") String bookTitle,
            @RequestParam("authorName") String authorName,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "edition", required = false) String edition,
            @RequestParam(value = "publisher", required = false) String publisher,
            @RequestParam("totalCopies") Integer totalCopies,
            @RequestParam(value = "availableCopies", required = false) Integer availableCopies,
            @RequestParam(value = "bookStatus", required = false) String bookStatus,
            @RequestParam("schoolId") String schoolId,
            @RequestParam("academicYear") String academicYear,
            @RequestParam(value = "language", required = false) String language,
            @RequestParam(value = "pages", required = false) Integer pages,
            @RequestParam(value = "publishedDate", required = false) String publishedDate,
            @RequestParam(value = "description", required = false) String description,

            // New pricing parameters
            @RequestParam(value = "purchaseRate", required = false) BigDecimal purchaseRate,
            @RequestParam(value = "sellingRate", required = false) BigDecimal sellingRate,
            @RequestParam(value = "mrp", required = false) BigDecimal mrp
    ) {
        try {
            BookDetailDTO dto = BookDetailDTO.builder()
                    .bookId(bookId)
                    .isbn(isbn)
                    .bookTitle(bookTitle)
                    .authorName(authorName)
                    .category(category)
                    .edition(edition)
                    .publisher(publisher)
                    .totalCopies(totalCopies)
                    .availableCopies(availableCopies)
                    .bookStatus(bookStatus)
                    .schoolId(schoolId)
                    .academicYear(academicYear)
                    .language(language)
                    .pages(pages)
                    .publishedDate(publishedDate)
                    .description(description)

                    // New pricing fields
                    .purchaseRate(purchaseRate)
                    .sellingRate(sellingRate)
                    .mrp(mrp)

                    .build();

            byte[] coverPhotoBytes = null;
            if (bookCoverPhoto != null && !bookCoverPhoto.isEmpty()) {
                coverPhotoBytes = bookCoverPhoto.getBytes();
            }

            BookDetail updated = bookDetailService.updateBookDetail(schoolId, id, dto, coverPhotoBytes);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Failed to update book: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to update book detail: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBookDetail(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId
    ) {
        try {
            bookDetailService.deleteBookDetail(schoolId, id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Failed to delete book: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to delete book detail: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getBookCoverPhoto(
            @PathVariable Long id,
            @RequestParam("schoolId") String schoolId
    ) {
        try {
            BookDetail book = bookDetailService.getBookById(schoolId, id);
            if (book.getBookCoverPhoto() == null || book.getBookCoverPhoto().length == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(book.getBookCoverPhoto());
        } catch (Exception e) {
            log.error("Failed to fetch book cover photo: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private BookDetailDTO convertToDTO(BookDetail book) {
        String base64Photo = null;
        if (book.getBookCoverPhoto() != null && book.getBookCoverPhoto().length > 0) {
            base64Photo = "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(book.getBookCoverPhoto());
        }

        return BookDetailDTO.builder()
                .id(book.getId())
                .bookId(book.getBookId())
                .isbn(book.getIsbn())
                .bookCoverPhotoPath(base64Photo)
                .bookTitle(book.getBookTitle())
                .authorName(book.getAuthorName())
                .category(book.getCategory())
                .edition(book.getEdition())
                .publisher(book.getPublisher())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .bookStatus(book.getBookStatus())
                .schoolId(book.getSchoolId())
                .academicYear(book.getAcademicYear())
                .language(book.getLanguage())
                .pages(book.getPages())
                .publishedDate(book.getPublishedDate())
                .description(book.getDescription())

                // New pricing fields
                .purchaseRate(book.getPurchaseRate())
                .sellingRate(book.getSellingRate())
                .mrp(book.getMrp())

                .build();
    }
}