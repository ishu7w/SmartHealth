package com.smarthealth;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;

public final class CareModels {

  @MappedSuperclass
  public abstract static class PatientItem extends Models.Row {

    public Long patientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
      name = "patientId",
      insertable = false,
      updatable = false,
      nullable = false
    )
    @JsonIgnore
    public Models.Patient patient;
  }

  @Entity
  @Table(
    name = "care_profiles",
    uniqueConstraints = @UniqueConstraint(columnNames = "patientId")
  )
  public static class Profile extends PatientItem {

    @Column(length = 2000)
    public String allergies = "";

    @Column(length = 3000)
    public String conditions = "";

    @Column(length = 3000)
    public String careNotes = "";

    public Instant updatedAt = Instant.now();
    public String updatedBy;
  }

  @Entity
  @Table(
    name = "medications",
    indexes = @Index(columnList = "patientId,status")
  )
  public static class Medication extends PatientItem {

    public String name, dose, schedule;

    @Column(length = 1000)
    public String notes;

    public String status = "Active";
    public String recordedBy, source;
    public Instant updatedAt = Instant.now();
  }

  @Entity(name = "CareAppointment")
  @Table(
    name = "appointments",
    indexes = {
      @Index(columnList = "patientId,scheduledAt"),
      @Index(columnList = "doctorId,scheduledAt"),
    }
  )
  public static class Appointment extends PatientItem {

    public Long doctorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
      name = "doctorId",
      insertable = false,
      updatable = false,
      nullable = false
    )
    @JsonIgnore
    public Models.User doctor;

    public Instant scheduledAt;
    public String patientName, doctorName, visitType;

    @Column(length = 1000)
    public String reason;

    public String status = "Requested";

    @Column(length = 2000)
    public String staffNotes = "";

    public Instant updatedAt = Instant.now();

    @Version
    public long version;
  }
}
