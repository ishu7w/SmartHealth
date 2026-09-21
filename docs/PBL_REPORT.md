# Integrated Smart Healthcare Computing Solution

**Subject:** Computer Architecture & Parallel Processing (CAPP)

**Domain:** Healthcare / Good Health and Well-being

**SDG:** 3 — Good Health and Well-being

## Abstract

This project demonstrates a healthcare data workflow and compares sequential and parallel processing of independent patient records. A React interface connects to a Java Spring Boot application with persistent MySQL records. Patients submit vital signs; staff inspect histories and respond to rule-based alerts. The computing laboratory generates seeded synthetic datasets and measures actual Java execution time using a sequential loop and an ExecutorService thread pool. Results are displayed with timings, speedup, task schedules, and performance charts.

## Problem and objectives

Healthcare datasets contain many independent records. Sequential execution processes them one after another, while parallel execution can distribute work across CPU cores. The project investigates when that distribution helps and when overhead outweighs the benefit. It also demonstrates data ownership, persistent record management, input validation, and explainable software rules without claiming medical diagnosis.

Objectives are to implement role-based workflows; collect six vital signs; detect demonstration threshold violations; persist histories and alerts; process 100–10,000 synthetic records; compare measured results; and explain CPU utilization, concurrency, scheduling, shared memory, and speedup.

## Modules

1. Account and profile management with Patient, Doctor, and Admin roles.
2. Rule-based health analysis: heart rate, blood pressure, oxygen, temperature, glucose, and respiratory rate.
3. Patient history, risk categories, and recent dashboard statistics.
4. Monitoring simulation with saved synthetic readings and configurable scenarios.
5. Alert lifecycle: New, Acknowledged, Resolved.
6. Sequential/parallel computation with selectable thread counts and dataset sizes.
7. Benchmark charts, thread intervals, JVM information, and persisted measurements.

## Algorithm

```text
generate immutable synthetic records from a seed
warm analyzer using up to 50 records

sequential:
    start monotonic timer
    for each record:
        analyze six vital signs
        perform disclosed CPU calculation
        accumulate result checksum
    stop timer

parallel:
    start monotonic timer
    create fixed thread pool
    submit one Callable per record
    collect every Future and accumulate checksum
    stop timer
    always shut down pool

verify sequential and parallel checksums match
calculate speedup and time saved
save measurements and return actual task intervals
```

The immutable data and independent task results avoid shared mutable clinical state. Atomic task counters provide live activity information. Timers exclude dataset construction and database saving. Measurements include scheduling overhead; they do not use sleep-based simulations of computation.

## Experimental procedure

Use the same dataset seed and thread count for comparisons. Run each of 100, 500, 1,000, 5,000, and 10,000 records several times on the same machine. Record Java version, logical processors, dataset size, thread count, sequential/parallel time, and speedup. Avoid other heavy work while measuring. Discuss warm-up/JIT variation and why a single run is not a definitive performance claim.

Record observations from the application's own benchmark history. No universal timing numbers are prefilled in this report because results depend on the host. The first 100 task intervals visualize scheduling; the full dataset contributes to the checksum and elapsed time.

## Requirements traceability

| Supplied section | Implementation |
|---|---|
| 1–2 Overview and roles | Session security, Account, Patients, Doctors, ownership enforcement |
| 3 Analysis | HealthAnalyzer and persisted risk/alerts |
| 4–5 Parallel/performance | ParallelHealthProcessor and Processing page |
| 6 Visualization | PerformanceCharts: time, speedup, mode bars |
| 7 Simulation | Monitoring page, periodic sequential requests, saved synthetic readings |
| 8 Alerts | Alerts page, staff acknowledgement/resolution |
| 9 Dashboard | Live statistics, risk distribution, recent readings/alerts, processing curves |
| 10 Datasets | Seeded generator for all five supported sizes |
| 11–12 Stack/database | React/Axios/Recharts, Spring Boot/JPA/Security, MySQL schema |
| 13 REST API | All requested patient/record/process/alert/dashboard endpoints |
| 14 Java implementation | Fixed ExecutorService, Callable/Future, cleanup, equality checks |
| 15 Architecture | About page and architecture documentation; the supplied section is truncated |

## Validation

Automated integration tests cover authentication, CSRF, patient isolation, staff restrictions, disabled-account revocation, validation, critical-risk overrides, alert transitions, deletion of dependent data, actual benchmark persistence, and equality across all supported dataset sizes. Browser tests exercise the three roles and responsive pages at desktop, tablet, and phone widths. The MySQL test profile runs against a separate disposable database.

## SDG 3 connection and limitations

The project illustrates how computing can help organize health information and bring threshold changes to attention. It supports educational discussion of accessible monitoring interfaces and efficient data processing. Its rules are simplified and unvalidated, so no clinical benefit or diagnostic accuracy is claimed. Simulation uses synthetic values. Alert display is not an emergency notification service. The CPU workload demonstrates parallel processing concepts rather than a real medical analysis algorithm.

Future extensions could include device integration, configurable/validated rules, audited staff actions, longer paginated histories, formal database migrations, and repeated-run statistical reporting. These are separate from the complete classroom workflow implemented here.
