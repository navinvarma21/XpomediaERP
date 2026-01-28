package com.backend.school_erp.controller;

import com.backend.school_erp.DTO.PersonDTO;
import com.backend.school_erp.entity.Person;
import com.backend.school_erp.repository.PersonRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/people")
public class PersonController {

    private final PersonRepository repository;

    public PersonController(PersonRepository repository) {
        this.repository = repository;
    }

    // GET all people (return DTOs)
    @GetMapping
    public List<PersonDTO> getAll() {
        return repository.findAll()
                .stream()
                .map(p -> new PersonDTO(p.getId(), p.getName(), p.getAge()))
                .toList();
    }

    // CREATE a person
    @PostMapping
    public PersonDTO create(@RequestBody Person person) {
        Person saved = repository.save(person);
        return new PersonDTO(saved.getId(), saved.getName(), saved.getAge());
    }

    // UPDATE a person by id
    @PutMapping("/{id}")
    public PersonDTO update(@PathVariable Long id, @RequestBody Person person) {
        Person updated = repository.findById(id)
                .map(p -> {
                    p.setName(person.getName());
                    p.setAge(person.getAge());
                    return repository.save(p);
                }).orElseThrow(() -> new RuntimeException("Person not found with id " + id));

        return new PersonDTO(updated.getId(), updated.getName(), updated.getAge());
    }

    // DELETE a person by id
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}


