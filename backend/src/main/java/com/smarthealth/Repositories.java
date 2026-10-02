package com.smarthealth;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

interface Users extends JpaRepository<Models.User, Long> {
  @org.springframework.data.jpa.repository.Lock(
    jakarta.persistence.LockModeType.PESSIMISTIC_WRITE
  )
  @org.springframework.data.jpa.repository.Query(
    "select u from Account u where u.id=:id"
  )
  Optional<Models.User> lockById(
    @org.springframework.data.repository.query.Param("id") Long id
  );

  Optional<Models.User> findByEmail(String email);
}

interface Patients extends JpaRepository<Models.Patient, Long> {
  @org.springframework.data.jpa.repository.Lock(
    jakarta.persistence.LockModeType.PESSIMISTIC_WRITE
  )
  @org.springframework.data.jpa.repository.Query(
    "select p from PatientProfile p where p.id=:id"
  )
  Optional<Models.Patient> lockById(
    @org.springframework.data.repository.query.Param("id") Long id
  );

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
