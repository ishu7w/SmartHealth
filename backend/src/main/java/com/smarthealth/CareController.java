package com.smarthealth;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
class CareController {

  final CareService care;
  final HealthcareService health;

  CareController(CareService c, HealthcareService h) {
    care = c;
    health = h;
  }

  @GetMapping("/patients/{id}/summary")
  Object summary(@PathVariable Long id, Authentication a) {
    return care.summary(id, health.user(a));
  }

  @PutMapping("/patients/{id}/care-profile")
  Object profile(
    @PathVariable Long id,
    @Valid @RequestBody CareInputs.Profile input,
    Authentication a
  ) {
    return care.profile(id, input, health.user(a));
  }

  @PostMapping("/patients/{id}/medications")
  @ResponseStatus(HttpStatus.CREATED)
  Object medication(
    @PathVariable Long id,
    @Valid @RequestBody CareInputs.Medication input,
    Authentication a
  ) {
    return care.medication(id, input, health.user(a));
  }

  @PutMapping("/medications/{id}/status")
  Object medicationStatus(
    @PathVariable Long id,
    @Valid @RequestBody CareInputs.MedicationStatus input,
    Authentication a
  ) {
    return care.medicationStatus(id, input.status(), health.user(a));
  }

  @GetMapping("/care/doctors")
  Object doctors() {
    return care.doctors();
  }

  @GetMapping("/appointments")
  Object appointments(Authentication a) {
    return care.visible(health.user(a));
  }

  @PostMapping("/appointments")
  @ResponseStatus(HttpStatus.CREATED)
  Object request(
    @Valid @RequestBody CareInputs.Appointment input,
    Authentication a
  ) {
    return care.request(input, health.user(a));
  }

  @PutMapping("/appointments/{id}")
  Object update(
    @PathVariable Long id,
    @Valid @RequestBody CareInputs.AppointmentUpdate input,
    Authentication a
  ) {
    return care.update(id, input, health.user(a));
  }
}
