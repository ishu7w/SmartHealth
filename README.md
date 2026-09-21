# Integrated Smart Healthcare Computing Solution

A complete college PBL application for **Computer Architecture & Parallel Processing (CAPP)**, aligned with **SDG 3 — Good Health and Well-being**.

The application combines patient accounts, persistent health records, threshold alerts, and a Java multithreading laboratory. The original SmartHealth interface is retained: dark artwork, glass surfaces, Instrument Serif headings, GSAP transitions, Lenis scrolling, and responsive navigation.

**Educational prototype only. It does not diagnose, prescribe, monitor medical devices, or contact emergency services. Use synthetic information for demonstrations.**

## What is implemented

| Area | Features |
|---|---|
| Patient | Registration, login, profile, six vital signs, saved history, risk scores, own alerts |
| Doctor | Patient search, risk filters, latest readings, full profile details, recent history, alert acknowledgement and resolution |
| Administrator | Patient creation/edit/deletion, doctor account creation/access revocation, statistics, performance experiments |
| Monitoring | Periodic synthetic measurements, scenario selection, chart, persisted readings and threshold alerts |
| Processing | Actual sequential loop and `ExecutorService` thread pool; 100, 500, 1,000, 5,000 or 10,000 records |
| Measurement | Wall time, process CPU time, active tasks, thread schedule, speedup, time saved, result checksum verification |
| Charts | Latest risk distribution, recent records/alerts, execution time vs dataset size, speedup vs size, mode comparison |
| Access control | BCrypt passwords, server sessions, CSRF protection, role checks, patient ownership checks, immediate disabled-account revocation on next request |

The default database is **MySQL**. An optional H2 profile allows local development without a database installation. The previous Python implementation is retained only in `legacy/` and is not used by the rebuilt application. The browser-only fallback and illustrative benchmark numbers have been removed.

## Quick start with MySQL and Docker

Requires Docker with Compose.

```sh
cp .env.example .env
# Edit .env: set your database passwords and an admin email/password.
docker compose up --build
```

Open **http://localhost:8080**. The Docker image serves the React application and Java API together, so session cookies and CSRF tokens share one origin. MySQL data is retained in the `mysql-data` volume. No default administrator password is embedded in the app.

`ADMIN_EMAIL` and `ADMIN_PASSWORD` create an administrator on the first startup for that email. Use a password of 12–72 characters. Later changes to those variables do not reset an existing account. Sign in as administrator to create doctor accounts; patients self-register.

`docker compose down` stops the services while retaining records. Deleting the database volume deletes those records. For a public deployment, put the application behind HTTPS, set `COOKIE_SECURE=true`, and provide secrets through the hosting platform.

## Local development

Requirements: **Java 21**, **Maven 3.9+**, **Node.js 22**, and MySQL 8.4+ (or the optional H2 demo profile). Set `JAVA_HOME` to a Java 21 installation if another Java version is the system default.

### Backend with MySQL

Create an empty database and a dedicated user with access to it. Export the connection and bootstrap settings in your shell:

```sh
export DATABASE_URL='jdbc:mysql://localhost:3306/smarthealth'
export DATABASE_USER='smarthealth'
export DATABASE_PASSWORD='your-database-password'
export ADMIN_EMAIL='your-admin-email@example.com'
export ADMIN_PASSWORD='your-admin-password-at-least-12-characters'
mvn -f backend/pom.xml spring-boot:run
```

The backend listens on port **8080**. JPA creates/updates the academic schema. For deployment to a maintained production system, replace automatic schema updates with reviewed database migrations.

### Optional offline database

For a classroom demo without MySQL, set the admin variables above, then run:

```sh
mvn -f backend/pom.xml spring-boot:run -Dspring-boot.run.profiles=demo
```

This stores H2 data under `backend/data/` when started using the command above. It is a separate database from MySQL. The active database profile is explicit; the application never silently switches storage when an API call fails.

### Frontend

In another terminal:

```sh
npm ci --prefix frontend
npm run dev --prefix frontend
```

Open **http://localhost:5173**. Vite proxies `/api` to port 8080. The optional `frontend/.env` should use `VITE_API_URL=/api`; cookies and API calls are designed for the same origin. No API keys belong in frontend environment variables.

### Build a combined executable JAR

```sh
sh scripts/build.sh
java -jar backend/target/smarthealth-2.0.0.jar
```

The same database/admin environment variables apply. The combined JAR serves the UI at port 8080 and supports direct navigation to every application page.

The historical `vercel.json` still builds the static frontend. **A static Vercel deployment alone cannot run this Java/MySQL system.** Use the combined container/JAR on a Java-capable host, or configure a same-origin reverse proxy to that backend before using a separately hosted frontend. A missing backend is shown as a connection error, never replaced with fake results. This rebuild does not automatically redeploy an existing public site.

## Classroom walkthrough

1. Register a patient, create a profile, and enter normal example readings: HR 75, BP 115/75, temperature 36.8°C, SpO₂ 98%, glucose 90, breathing 16/min.
2. Save another reading with SpO₂ 88%. Its educational risk becomes Critical and a low-oxygen alert appears.
3. Sign in as a doctor created by an administrator. Find that patient, inspect history, acknowledge and resolve the alert.
4. Open Monitoring, select the patient, and start the critical oxygen scenario. Pause it after a few readings. These are explicitly marked as simulations in history.
5. Open Processing as doctor/admin. Compare the supported dataset sizes using the same seed and thread count. Repeat each run; inspect charts, schedule, CPU information, and the history table.
6. Explain why parallel execution may be faster for larger workloads and slower for smaller ones. Do not promise a speedup on every machine.

## Benchmark methodology

`ParallelHealthProcessor` generates an immutable seeded dataset. Each task performs the same six vital checks and a disclosed CPU-only mixing loop of 12,000 iterations. That loop models computational work for teaching; it is not a clinical algorithm. Its result contributes to a 64-bit checksum, preventing the calculation from being discarded as unused.

- Sequential mode loops through the dataset on one thread.
- Parallel mode submits one `Callable` per record to a fixed pool and collects every `Future`. The pool is shut down in a `finally` block.
- Timing uses `System.nanoTime()`. Dataset generation and database writes are outside the timer. Parallel timing includes pool creation, submission, and result collection; shutdown occurs afterward.
- A 50-record sequential warm-up precedes the measured run. Comparisons measure sequential first, then parallel. JVM compilation, order, other applications, CPU limits, and scheduling overhead can influence results.
- Both modes must produce identical checksums before a comparison is saved. The server enforces this using full-width Java integers; the browser receives checksums as strings to preserve precision.
- `speedup = sequentialTime / parallelTime`; `timeSaved = sequentialTime - parallelTime`. Negative time saved is displayed honestly.
- Only one benchmark runs per server instance at a time. Other attempts receive HTTP 409. Thread count is limited to 1–32, defaulted in the UI to the server's available logical processors (capped at 32).
- Thread charts show actual timings for the first 100 records; every record is still processed. CPU time is process-wide, includes other JVM work, and may have coarse resolution. CPU load is a recent sample, not a per-run utilization measurement.
- Benchmark charts use the latest comparison per dataset size from the most recent 100 saved runs. They start empty. Check thread counts before comparing points.

## Risk rules

All thresholds are simplified teaching rules, not validated medical guidance. Each normal parameter scores 0, warning 60, critical 100. The rounded mean is raised to at least 26 for any warning or 76 for any critical parameter. This gives an explainable score without hiding an isolated critical signal.

| Score | Status |
|---|---|
| 0–25 | Normal |
| 26–50 | Attention Required |
| 51–75 | High Risk |
| 76–100 | Critical |

Exact parameter thresholds and boundary tests are in `HealthAnalyzer.java` and `HealthcareIntegrationTest.java`. Alert states are New → Acknowledged → Resolved; staff can also resolve directly. A resolved alert cannot be reopened through the transition endpoints.

## Verification

```sh
# Backend integration, authorization, validation, risk boundaries, and all dataset sizes
mvn -f backend/pom.xml test

# Frontend production compilation
npm run build --prefix frontend

# End-to-end: start the app with a test-only administrator first
cd frontend
npx playwright install chromium
E2E_ADMIN_EMAIL='admin@example.test' E2E_ADMIN_PASSWORD='local-test-password-123' npm run test:e2e
```

The end-to-end test uses a dedicated test/demo database and creates synthetic patient/doctor accounts. It covers registration, profiles, readings, critical alerts, monitoring, role access, a real benchmark, and pages at 375/768/1440px. Use `PLAYWRIGHT_CHANNEL=chrome` to test with installed Chrome, and `APP_URL=http://localhost:8080` to test the combined JAR.

To run the backend tests against a **disposable MySQL database**, set `TEST_DATABASE_URL`, `TEST_DATABASE_USER`, and `TEST_DATABASE_PASSWORD`. **The test profile creates and drops tables, so never point it at your application database.** CI runs the same suite on MySQL and then exercises the browser flow.

## Project structure

```text
backend/                  Java 21 / Spring Boot application and integration tests
frontend/                 Existing React UI, new authenticated pages and browser tests
docs/                     Architecture, API reference, requirements and academic report
scripts/build.sh          Build the React UI into an executable Java application
Dockerfile, compose.yaml  Combined application plus persistent MySQL
legacy/                   Archived Python backend and former UI verification scripts
```

Read [Architecture](docs/ARCHITECTURE.md), [API reference](docs/API.md), and [PBL report](docs/PBL_REPORT.md) for presentation and implementation details. The supplied prompt ends at the beginning of section 15; the About page and report cover the stated computer architecture concepts without assuming missing requirements.
