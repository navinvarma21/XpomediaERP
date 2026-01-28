package com.backend.school_erp.controller.Library;

import com.backend.school_erp.DTO.Library.PublisherDTO;
import com.backend.school_erp.entity.Library.Publisher;
import com.backend.school_erp.service.Library.PublisherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/library/publishers")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Slf4j
public class PublisherController {

    private final PublisherService publisherService;

    @GetMapping
    public ResponseEntity<List<Publisher>> getPublishers(
            @RequestParam String schoolId,
            @RequestParam String year
    ) {
        return ResponseEntity.ok(publisherService.getPublishers(schoolId, year));
    }

    @PostMapping
    public ResponseEntity<Publisher> addPublisher(@RequestBody PublisherDTO dto) {
        Publisher created = publisherService.addPublisher(dto.getSchoolId(), dto);
        return ResponseEntity.created(URI.create("/api/library/publishers/" + created.getId()))
                .body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePublisher(@PathVariable Long id, @RequestBody PublisherDTO dto) {
        return publisherService.updatePublisher(dto.getSchoolId(), id, dto.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePublisher(@PathVariable Long id, @RequestParam String schoolId) {
        boolean deleted = publisherService.deletePublisher(schoolId, id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}