# Verification — 2 October 2026

Checks use Java 21, Chrome, and synthetic records. The existing visual foundation and motion remain intact.

| Check | Result |
|---|---|
| Spring integration suite | 15 tests passed, including ownership, care records, medications, appointment transitions/conflicts, and demo setup |
| Packaged React + Spring Boot application | Production build and executable JAR started successfully |
| Browser workflows | Two tests passed: patient, doctor, administrator, care notes, medication entries, CSV, calendar export, monitoring, alerts, and actual processing |
| Responsive layout | Nine main pages checked at 375, 768, and 1440 pixels without document-level horizontal overflow |
| Motion and navigation | Pause control, mobile menu, and guarded navigation passed |
| Browser JavaScript errors | None during successful walkthroughs |
| CSV safety | Formula neutralization and quotation escaping passed |
| Restart persistence | Saved patients, care summaries, medications, appointments, readings, alerts, and benchmarks matched after the Java process restarted; administrator signed in again |
| Real benchmark preparation | All five dataset sizes completed with matching sequential/parallel results; measurements saved locally in ignored demo-output |

The default persistent database is embedded H2. No MySQL server is required. GitHub Actions repeats the build, integration tests, CSV test, browser workflows, and restart check.

The local Docker daemon was unavailable, so a local container build is not claimed. Deployment configuration is prepared, but public hosting has not been activated: the hosting provider/account still needs to be identified. The embedded database requires a persistent disk and a single application instance.

Benchmark timings vary with hardware, warm-up, and load. The demo generates actual results instead of promising a fixed speedup.
