package com.smarthealth;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

interface Users extends JpaRepository<Models.User, Long> {
  Optional<Models.User> findByEmail(String email);
}

interface Patients extends JpaRepository<Models.Patient, Long> {
  Optional<Models.Patient> findByUserId(Long userId);
}

interface Records extends JpaRepository<Models.HealthRecord, Long> {
  List<Models.HealthRecord> findTop100ByPatientIdOrderByCreatedAtDesc(Long id);
  Optional<Models.HealthRecord> findFirstByPatientIdOrderByCreatedAtDesc(
    Long id
  );
  List<Models.HealthRecord> findTop100ByOrderByCreatedAtDesc();
  void deleteByPatientId(Long id);
}

interface Alerts extends JpaRepository<Models.Alert, Long> {
  List<Models.Alert> findTop100ByPatientIdOrderByCreatedAtDesc(Long id);
  List<Models.Alert> findTop100ByOrderByCreatedAtDesc();
  long countByStatusNot(String status);
  long countByPatientIdAndStatusNot(Long patientId, String status);
  void deleteByPatientId(Long id);
}

interface Benchmarks extends JpaRepository<Models.Benchmark, Long> {
  List<Models.Benchmark> findTop100ByOrderByCreatedAtDesc();
}
