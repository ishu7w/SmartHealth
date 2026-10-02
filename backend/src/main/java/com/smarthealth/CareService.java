package com.smarthealth;

import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
class CareService {

  final HealthcareService health;
  final CareProfiles profiles;
  final Medications medications;
  final Appointments appointments;
  final Users users;
  final Patients patients;

  CareService(
    HealthcareService h,
    CareProfiles p,
    Medications m,
    Appointments a,
    Users u,
    Patients patients
  ) {
    health = h;
    profiles = p;
    medications = m;
    appointments = a;
    users = u;
    this.patients = patients;
  }

  Object summary(Long id, Models.User user) {
    var patient = health.access(id, user);
    var profile = profiles.findByPatientId(id).orElseGet(() -> {
      var p = new CareModels.Profile();
      p.patientId = id;
      return p;
    });
    return Map.of(
      "patient",
      patient,
      "profile",
      profile,
      "medications",
      medications.findByPatientIdOrderByCreatedAtDesc(id),
      "readings",
      health.history(id, user),
      "appointments",
      appointments.findTop100ByPatientIdOrderByScheduledAtDesc(id),
      "generatedAt",
      Instant.now()
    );
  }

  CareModels.Profile profile(
    Long id,
    CareInputs.Profile input,
    Models.User user
  ) {
    health.access(id, user);
    var p = profiles.findByPatientId(id).orElseGet(CareModels.Profile::new);
    p.patientId = id;
    p.allergies = input.allergies().trim();
    p.conditions = input.conditions().trim();
    p.careNotes = input.careNotes().trim();
    p.updatedAt = Instant.now();
    p.updatedBy = user.name;
    return profiles.save(p);
  }

  CareModels.Medication medication(
    Long patientId,
    CareInputs.Medication input,
    Models.User user
  ) {
    health.access(patientId, user);
    var m = new CareModels.Medication();
    m.patientId = patientId;
    m.name = input.name().trim();
    m.dose = input.dose().trim();
    m.schedule = input.schedule().trim();
    m.notes = input.notes().trim();
    m.recordedBy = user.name;
    m.source = user.role.equals("PATIENT")
      ? "Patient entered"
      : "Staff entered";
    return medications.save(m);
  }

  CareModels.Medication medicationStatus(
    Long id,
    String status,
    Models.User user
  ) {
    var m = medications
      .findById(id)
      .orElseThrow(() ->
        new ResponseStatusException(
          HttpStatus.NOT_FOUND,
          "Medication not found"
        )
      );
    health.access(m.patientId, user);
    m.status = status;
    m.updatedAt = Instant.now();
    return medications.save(m);
  }

  List<Map<String, Object>> doctors() {
    return users
      .findAll()
      .stream()
      .filter(u -> u.enabled && u.role.equals("DOCTOR"))
      .map(u -> Map.<String, Object>of("id", u.id, "name", u.name))
      .toList();
  }

  List<CareModels.Appointment> visible(Models.User user) {
    return health.staff(user)
      ? appointments.findTop100ByOrderByScheduledAtDesc()
      : patients
          .findByUserId(user.id)
          .map(p ->
            appointments.findTop100ByPatientIdOrderByScheduledAtDesc(p.id)
          )
          .orElse(List.of());
  }

  CareModels.Appointment request(
    CareInputs.Appointment input,
    Models.User user
  ) {
    var p = health.access(input.patientId(), user);
    var doctor = users
      .findById(input.doctorId())
      .filter(u -> u.enabled && u.role.equals("DOCTOR"))
      .orElseThrow(() ->
        new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Choose an active doctor"
        )
      );
    if (
      input.scheduledAt().isAfter(Instant.now().plus(Duration.ofDays(365)))
    ) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "Choose a time within the next year"
    );
    var a = new CareModels.Appointment();
    a.patientId = p.id;
    a.patientName = p.name;
    a.doctorId = doctor.id;
    a.doctorName = doctor.name;
    a.scheduledAt = input.scheduledAt();
    a.visitType = input.visitType();
    a.reason = input.reason().trim();
    return appointments.save(a);
  }

  CareModels.Appointment update(
    Long id,
    CareInputs.AppointmentUpdate input,
    Models.User user
  ) {
    // Lock the doctor before the appointment so confirmations for the same doctor serialize.
    var found = appointments
      .findById(id)
      .orElseThrow(() ->
        new ResponseStatusException(
          HttpStatus.NOT_FOUND,
          "Appointment not found"
        )
      );
    health.access(found.patientId, user);
    if (
      !health.staff(user) && !input.status().equals("Cancelled")
    ) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    if (
      user.role.equals("DOCTOR") && !user.id.equals(found.doctorId)
    ) throw new ResponseStatusException(
      HttpStatus.FORBIDDEN,
      "Only the assigned doctor or an administrator can change this appointment"
    );
    var doctor = (Models.User) org.hibernate.Hibernate.unproxy(
      users.lockById(found.doctorId).orElseThrow()
    );
    patients.lockById(found.patientId).orElseThrow();
    var a = appointments.lockById(id).orElseThrow();
    if (a.version != input.version()) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "This appointment changed. Refresh and try again"
    );
    if (
      a.status.equals("Cancelled") || a.status.equals("Completed")
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "This appointment is already closed"
    );
    if (input.status().equals("Confirmed")) {
      if (
        !a.status.equals("Requested") ||
        !a.scheduledAt.isAfter(Instant.now()) ||
        !doctor.enabled
      ) throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "Only future requests with an active doctor can be confirmed"
      );
      var from = a.scheduledAt.minus(Duration.ofMinutes(30));
      var to = a.scheduledAt.plus(Duration.ofMinutes(30));
      if (
        appointments.existsByDoctorIdAndStatusAndScheduledAtGreaterThanAndScheduledAtLessThanAndIdNot(
          a.doctorId,
          "Confirmed",
          from,
          to,
          a.id
        ) ||
        appointments.existsByPatientIdAndStatusAndScheduledAtGreaterThanAndScheduledAtLessThanAndIdNot(
          a.patientId,
          "Confirmed",
          from,
          to,
          a.id
        )
      ) throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "A confirmed 30-minute appointment overlaps this time"
      );
    }
    if (
      input.status().equals("Completed") &&
      (!a.status.equals("Confirmed") || a.scheduledAt.isAfter(Instant.now()))
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "Complete a confirmed visit after its start time"
    );
    a.status = input.status();
    if (health.staff(user)) a.staffNotes = input.staffNotes().trim();
    a.updatedAt = Instant.now();
    return appointments.save(a);
  }
}
