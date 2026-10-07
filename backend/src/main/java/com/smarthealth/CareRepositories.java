package com.smarthealth;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

interface CareProfiles extends JpaRepository<CareModels.Profile, Long> {
  Optional<CareModels.Profile> findByPatientId(Long patientId);
  void deleteByPatientId(Long id);
}

interface Medications extends JpaRepository<CareModels.Medication, Long> {
  List<CareModels.Medication> findByPatientIdOrderByCreatedAtDesc(
    Long patientId
  );
  void deleteByPatientId(Long id);
}

interface Appointments extends JpaRepository<CareModels.Appointment, Long> {
  List<CareModels.Appointment> findTop100ByDoctorIdOrderByScheduledAtDesc(
    Long id
  );
  List<CareModels.Appointment> findTop100ByOrderByScheduledAtDesc();
  List<CareModels.Appointment> findTop100ByPatientIdOrderByScheduledAtDesc(
    Long id
  );
  boolean existsByDoctorIdAndStatusAndScheduledAtGreaterThanAndScheduledAtLessThanAndIdNot(
    Long doctorId,
    String status,
    Instant after,
    Instant before,
    Long excluded
  );
  boolean existsByPatientIdAndStatusAndScheduledAtGreaterThanAndScheduledAtLessThanAndIdNot(
    Long patientId,
    String status,
    Instant after,
    Instant before,
    Long excluded
  );

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from CareAppointment a where a.id=:id")
  Optional<CareModels.Appointment> lockById(@Param("id") Long id);

  void deleteByPatientId(Long id);
}
