package com.smarthealth;

import jakarta.validation.constraints.*;
import java.time.Instant;

public final class CareInputs {

  public record Profile(
    @NotNull @Size(max = 2000) String allergies,
    @NotNull @Size(max = 3000) String conditions,
    @NotNull @Size(max = 3000) String careNotes
  ) {}

  public record Medication(
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Size(max = 120) String dose,
    @NotBlank @Size(max = 200) String schedule,
    @NotNull @Size(max = 1000) String notes
  ) {}

  public record MedicationStatus(
    @NotBlank @Pattern(regexp = "Active|Stopped") String status
  ) {}

  public record Appointment(
    @NotNull Long patientId,
    @NotNull Long doctorId,
    @NotNull @Future Instant scheduledAt,
    @NotBlank @Pattern(regexp = "In person|Phone|Video") String visitType,
    @NotBlank @Size(max = 1000) String reason
  ) {}

  public record AppointmentUpdate(
    @NotBlank @Pattern(regexp = "Confirmed|Cancelled|Completed") String status,
    @NotNull @Size(max = 2000) String staffNotes,
    @NotNull @Min(0) Long version
  ) {}
}
