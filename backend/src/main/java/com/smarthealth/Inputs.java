package com.smarthealth;

import jakarta.validation.constraints.*;

public final class Inputs {

  public record Register(
    @Email @NotBlank @Size(max = 150) String email,
    @NotBlank @Size(min = 12, max = 72) String password,
    @NotBlank @Size(max = 100) String name
  ) {}

  public record Patient(
    @NotBlank @Size(max = 100) String name,
    @Min(1) @Max(120) int age,
    @NotBlank
    @Pattern(regexp = "Female|Male|Other|Prefer not to say")
    String gender,
    @Pattern(regexp = "|A[+-]|B[+-]|AB[+-]|O[+-]|Unknown") String bloodGroup,
    @DecimalMin("30") @DecimalMax("250") Double height,
    @DecimalMin("1") @DecimalMax("400") Double weight,
    @Size(max = 30) String phone,
    @Size(max = 100) String emergencyContact
  ) {}

  public record Vitals(
    @NotNull Long patientId,
    @DecimalMin("20") @DecimalMax("250") double heartRate,
    @DecimalMin("50") @DecimalMax("250") double systolicBP,
    @DecimalMin("30") @DecimalMax("160") double diastolicBP,
    @DecimalMin("30") @DecimalMax("43") double temperature,
    @DecimalMin("50") @DecimalMax("100") double spo2,
    @DecimalMin("20") @DecimalMax("600") double glucose,
    @DecimalMin("5") @DecimalMax("60") double respiratoryRate,
    boolean simulated
  ) {}

  public record Benchmark(
    @Min(100) @Max(10000) int numberOfRecords,
    @Min(1) @Max(32) int threadCount,
    long seed
  ) {}
}
