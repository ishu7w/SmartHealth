package com.smarthealth;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
class HealthcareService {

  final Users users;
  final Patients patients;
  final Records records;
  final Alerts alerts;
  final HealthAnalyzer analyzer;
  final Appointments appointments;
  final Medications medications;
  final CareProfiles profiles;

  HealthcareService(
    Users u,
    Patients p,
    Records r,
    Alerts a,
    HealthAnalyzer h,
    Appointments appointments,
    Medications medications,
    CareProfiles profiles
  ) {
    users = u;
    patients = p;
    records = r;
    alerts = a;
    analyzer = h;
    this.appointments = appointments;
    this.medications = medications;
    this.profiles = profiles;
  }

  Models.User user(Authentication auth) {
    var u = (Models.User) org.hibernate.Hibernate.unproxy(
      users.findByEmail(auth.getName()).orElseThrow()
    );
    if (!u.enabled) throw new ResponseStatusException(
      HttpStatus.FORBIDDEN,
      "Account disabled"
    );
    return u;
  }

  boolean staff(Models.User u) {
    return !u.role.equals("PATIENT");
  }

  Models.Patient access(Long id, Models.User u) {
    var p = (Models.Patient) org.hibernate.Hibernate.unproxy(
      patients
        .findById(id)
        .orElseThrow(() ->
          new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found")
        )
    );
    if (
      !staff(u) && !Objects.equals(p.userId, u.id)
    ) throw new ResponseStatusException(
      HttpStatus.FORBIDDEN,
      "Patient access denied"
    );
    return p;
  }

  List<Models.Patient> visible(Models.User u) {
    var visible = staff(u)
      ? patients.findAll()
      : patients.findByUserId(u.id).stream().toList();
    for (var p : visible)
      p.latestReading = records
        .findFirstByPatientIdOrderByCreatedAtDesc(p.id)
        .orElse(null);
    return visible;
  }

  long activeAlerts(Models.User u) {
    return staff(u)
      ? alerts.countByStatusNot("Resolved")
      : patients
          .findByUserId(u.id)
          .map(p -> alerts.countByPatientIdAndStatusNot(p.id, "Resolved"))
          .orElse(0L);
  }

  List<Models.HealthRecord> history(Long id, Models.User u) {
    access(id, u);
    return records.findTop100ByPatientIdOrderByCreatedAtDesc(id);
  }

  Models.HealthRecord latest(Long id, Models.User u) {
    access(id, u);
    return records
      .findFirstByPatientIdOrderByCreatedAtDesc(id)
      .orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "No readings yet")
      );
  }

  List<Models.HealthRecord> readings(Models.User u) {
    return staff(u)
      ? records.findTop100ByOrderByCreatedAtDesc()
      : patients
          .findByUserId(u.id)
          .map(p -> records.findTop100ByPatientIdOrderByCreatedAtDesc(p.id))
          .orElse(List.of());
  }

  Models.Patient save(Long id, Inputs.Patient input, Models.User u) {
    var p = id == null ? new Models.Patient() : access(id, u);
    if (id == null) {
      if (
        !staff(u) && patients.findByUserId(u.id).isPresent()
      ) throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "Profile already exists"
      );
      p.userId = staff(u) ? null : u.id;
      p.patientId =
        "P-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    p.name = input.name().trim();
    p.age = input.age();
    p.gender = input.gender();
    p.bloodGroup = input.bloodGroup();
    p.height = input.height();
    p.weight = input.weight();
    p.phone = input.phone();
    p.emergencyContact = input.emergencyContact();
    return patients.save(p);
  }

  void delete(Long id, Models.User u) {
    if (!u.role.equals("ADMIN")) throw new ResponseStatusException(
      HttpStatus.FORBIDDEN
    );
    var p = access(id, u);
    appointments.deleteByPatientId(id);
    medications.deleteByPatientId(id);
    profiles.deleteByPatientId(id);
    alerts.deleteByPatientId(id);
    records.deleteByPatientId(id);
    patients.delete(p);
  }

  Models.HealthRecord record(Inputs.Vitals v, Models.User u) {
    var p = access(v.patientId(), u);
    if (v.systolicBP() <= v.diastolicBP()) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "Systolic pressure must exceed diastolic pressure"
    );
    var analysis = analyzer.analyze(v);
    var r = new Models.HealthRecord();
    r.patientId = p.id;
    r.heartRate = v.heartRate();
    r.systolicBP = v.systolicBP();
    r.diastolicBP = v.diastolicBP();
    r.temperature = v.temperature();
    r.spo2 = v.spo2();
    r.glucose = v.glucose();
    r.respiratoryRate = v.respiratoryRate();
    r.simulated = v.simulated();
    r.riskScore = analysis.riskScore();
    r.healthStatus = analysis.healthStatus();
    records.save(r);
    for (var signal : analysis.signals())
      if (signal.risk() > 0) {
        var a = new Models.Alert();
        a.patientId = p.id;
        a.patientName = p.name;
        a.parameter = signal.parameter();
        a.measuredValue = signal.parameter().equals("Blood pressure")
          ? v.systolicBP() + " / " + v.diastolicBP()
          : Double.toString(signal.value());
        a.riskLevel = signal.risk() == 100 ? "Critical" : "Attention Required";
        a.message = signal.message();
        alerts.save(a);
      }
    return r;
  }

  List<Models.Alert> alerts(Models.User u) {
    return staff(u)
      ? alerts.findTop100ByOrderByCreatedAtDesc()
      : patients
          .findByUserId(u.id)
          .map(p -> alerts.findTop100ByPatientIdOrderByCreatedAtDesc(p.id))
          .orElse(List.of());
  }

  Models.Alert transition(Long id, Models.User u, String status) {
    if (!staff(u)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    var a = alerts
      .findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    if (a.status.equals("Resolved")) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "Alert already resolved"
    );
    a.status = status;
    a.acknowledgedBy = u.id;
    return alerts.save(a);
  }
}
