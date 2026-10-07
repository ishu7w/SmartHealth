package com.smarthealth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
class PortalController {

  record NewConversation(
    @NotNull Long patientId,
    @NotNull Long doctorId,
    @NotBlank @Size(max = 160) String subject,
    @NotBlank @Size(max = 4000) String body
  ) {}

  record Reply(@NotBlank @Size(max = 4000) String body) {}

  record ReadThrough(@NotNull Long messageId) {}

  record NewTask(
    @NotBlank @Size(max = 160) String title,
    @NotNull @Size(max = 2000) String instructions,
    @NotNull LocalDate dueDate
  ) {}

  record TaskChange(
    @NotBlank @Pattern(regexp = "Open|Completed|Cancelled") String status,
    @NotNull @Min(0) Long version
  ) {}

  final PortalService portal;
  final HealthcareService health;

  @org.springframework.beans.factory.annotation.Value(
    "${smarthealth.practice-tools:false}"
  )
  boolean practiceTools;

  PortalController(PortalService p, HealthcareService h) {
    portal = p;
    health = h;
  }

  @GetMapping("/portal/config")
  Object config() {
    return java.util.Map.of("practiceTools", practiceTools);
  }

  @GetMapping("/conversations")
  Object list(Authentication a) {
    return portal.visible(health.user(a));
  }

  @PostMapping("/conversations")
  @ResponseStatus(HttpStatus.CREATED)
  Object create(@Valid @RequestBody NewConversation body, Authentication a) {
    return portal.create(body, health.user(a));
  }

  @GetMapping("/conversations/{id}")
  Object thread(
    @PathVariable Long id,
    @RequestParam(defaultValue = "0") int page,
    Authentication a
  ) {
    if (
      page < 0 || page > 10000
    ) throw new org.springframework.web.server.ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "Invalid page"
    );
    return portal.thread(id, page, health.user(a));
  }

  @PostMapping("/conversations/{id}/read")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void read(
    @PathVariable Long id,
    @Valid @RequestBody ReadThrough body,
    Authentication a
  ) {
    portal.read(id, body.messageId(), health.user(a));
  }

  @PostMapping("/conversations/{id}/messages")
  @ResponseStatus(HttpStatus.CREATED)
  Object reply(
    @PathVariable Long id,
    @Valid @RequestBody Reply body,
    Authentication a
  ) {
    return portal.reply(id, body.body(), health.user(a));
  }

  @GetMapping("/patients/{id}/tasks")
  Object tasks(@PathVariable Long id, Authentication a) {
    return portal.tasks(id, health.user(a));
  }

  @PostMapping("/patients/{id}/tasks")
  @ResponseStatus(HttpStatus.CREATED)
  Object addTask(
    @PathVariable Long id,
    @Valid @RequestBody NewTask body,
    Authentication a
  ) {
    return portal.addTask(id, body, health.user(a));
  }

  @PutMapping("/tasks/{id}")
  Object update(
    @PathVariable Long id,
    @Valid @RequestBody TaskChange body,
    Authentication a
  ) {
    return portal.updateTask(id, body, health.user(a));
  }
}
