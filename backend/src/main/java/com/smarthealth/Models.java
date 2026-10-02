package com.smarthealth;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;

/** Persistence objects contain no mutable shared benchmark state. */
public final class Models {

  private Models() {}

  @MappedSuperclass
  public abstract static class Row {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, updatable = false)
    public Instant createdAt = Instant.now();
  }

  @Entity(name = "Account")
  @Table(name = "users")
  public static class User extends Row {

    @Column(unique = true, nullable = false)
    public String email;

    public String name;

    @JsonIgnore
    public String password;

    public String role;
    public boolean enabled = true;
  }

  @Entity(name = "PatientProfile")
  @Table(
    name = "patients",
    indexes = @Index(columnList = "userId", unique = true)
  )
  public static class Patient extends Row {

    @Column(unique = true)
    public String patientId;

    public Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", insertable = false, updatable = false)
    @JsonIgnore
    public User account;

    @Transient
    public HealthRecord latestReading;

    public String name;
    public int age;
    public String gender;
    public String bloodGroup;
    public Double height;
    public Double weight;
    public String phone;
    public String emergencyContact;
  }

  @Entity
  @Table(
    name = "health_records",
    indexes = @Index(columnList = "patientId,createdAt")
  )
  public static class HealthRecord extends Row {

    public Long patientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
      name = "patientId",
      insertable = false,
      updatable = false,
      nullable = false
    )
    @JsonIgnore
    public Patient patient;

    public double heartRate, systolicBP, diastolicBP, temperature, spo2, glucose, respiratoryRate;
    public int riskScore;
    public String healthStatus;
    public boolean simulated;
  }

  @Entity
  @Table(
    name = "health_alerts",
    indexes = @Index(columnList = "patientId,status")
  )
  public static class Alert extends Row {

    public Long patientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
      name = "patientId",
      insertable = false,
      updatable = false,
      nullable = false
    )
    @JsonIgnore
    public Patient patient;

    public String patientName, parameter, measuredValue, riskLevel, message;
    public String status = "New";
    public Long acknowledgedBy;
  }

  @Entity
  @Table(name = "benchmark_results")
  public static class Benchmark extends Row {

    public int numberOfRecords, threadCount;
    public String mode;
    public Double sequentialTime, parallelTime, speedup, timeSaved;
    public double processCpuMs;

    @com.fasterxml.jackson.databind.annotation.JsonSerialize(
      using = com.fasterxml.jackson.databind.ser.std.ToStringSerializer.class
    )
    public long checksum;

    public long seed;
  }
}
