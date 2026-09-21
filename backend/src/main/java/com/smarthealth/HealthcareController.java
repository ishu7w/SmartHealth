package com.smarthealth;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
class HealthcareController {

  final HealthcareService s;
  final Benchmarks benchmarks;
  final ParallelHealthProcessor processor;

  HealthcareController(
    HealthcareService s,
    Benchmarks b,
    ParallelHealthProcessor p
  ) {
    this.s = s;
    benchmarks = b;
    processor = p;
  }

  @GetMapping("/patients")
  Object patients(
    Authentication a,
    @RequestParam(defaultValue = "") String search
  ) {
    return s
      .visible(s.user(a))
      .stream()
      .filter(p ->
        (p.name + " " + p.patientId)
          .toLowerCase()
          .contains(search.toLowerCase())
      )
      .toList();
  }

  @GetMapping("/patients/{id}")
  Object patient(@PathVariable Long id, Authentication a) {
    return s.access(id, s.user(a));
  }

  @PostMapping("/patients")
  @ResponseStatus(HttpStatus.CREATED)
  Object create(@Valid @RequestBody Inputs.Patient p, Authentication a) {
    return s.save(null, p, s.user(a));
  }

  @PutMapping("/patients/{id}")
  Object update(
    @PathVariable Long id,
    @Valid @RequestBody Inputs.Patient p,
    Authentication a
  ) {
    return s.save(id, p, s.user(a));
  }

  @DeleteMapping("/patients/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void delete(@PathVariable Long id, Authentication a) {
    s.delete(id, s.user(a));
  }

  @PostMapping("/health-records")
  @ResponseStatus(HttpStatus.CREATED)
  Object record(@Valid @RequestBody Inputs.Vitals v, Authentication a) {
    return s.record(v, s.user(a));
  }

  @GetMapping("/health-records")
  Object records(Authentication a) {
    return s.readings(s.user(a));
  }

  @GetMapping("/health-records/patient/{id}")
  Object history(@PathVariable Long id, Authentication a) {
    return s.history(id, s.user(a));
  }

  @GetMapping("/health-records/latest/{id}")
  Object latest(@PathVariable Long id, Authentication a) {
    return s.latest(id, s.user(a));
  }

  @GetMapping("/alerts")
  Object alerts(Authentication a) {
    return s.alerts(s.user(a));
  }

  @GetMapping("/alerts/critical")
  Object critical(Authentication a) {
    return s
      .alerts(s.user(a))
      .stream()
      .filter(x -> x.riskLevel.equals("Critical"))
      .toList();
  }

  @PutMapping("/alerts/{id}/acknowledge")
  Object acknowledge(@PathVariable Long id, Authentication a) {
    return s.transition(id, s.user(a), "Acknowledged");
  }

  @PutMapping("/alerts/{id}/resolve")
  Object resolve(@PathVariable Long id, Authentication a) {
    return s.transition(id, s.user(a), "Resolved");
  }

  @GetMapping("/dashboard/statistics")
  Object statistics(Authentication a) {
    var u = s.user(a);
    var patients = s.visible(u);
    var distribution = new LinkedHashMap<String, Long>();
    for (String risk : List.of(
      "Normal",
      "Attention Required",
      "High Risk",
      "Critical",
      "No readings"
    ))
      distribution.put(risk, 0L);
    for (var p : patients) {
      String risk =
        p.latestReading == null ? "No readings" : p.latestReading.healthStatus;
      distribution.merge(risk, 1L, Long::sum);
    }
    var runs = s.staff(u)
      ? benchmarks.findTop100ByOrderByCreatedAtDesc()
      : List.<Models.Benchmark>of();
    return Map.of(
      "totalPatients",
      patients.size(),
      "riskDistribution",
      distribution,
      "activeAlerts",
      s.activeAlerts(u),
      "recordsProcessed",
      runs
        .stream()
        .mapToLong(b -> b.numberOfRecords * (b.mode.equals("compare") ? 2 : 1))
        .sum(),
      "parallelTasksRunning",
      processor.activeTasks.get(),
      "averageProcessingTime",
      runs
        .stream()
        .mapToDouble(b ->
          b.parallelTime == null ? b.sequentialTime : b.parallelTime
        )
        .average()
        .orElse(0),
      "benchmarkSampleSize",
      runs.size()
    );
  }
}
