# Verification — 5 October 2026

Checks use Java 21, Chrome, and synthetic records isolated from the local application database.

| Check | Result |
|---|---|
| Spring integration suite | 18 tests passed, including ownership, conversation privacy, disabled-doctor rejection, paginated message history, read acknowledgement, task validation/versions, and dependent-data deletion |
| Normal care mode | One additional test passed: no demo/benchmark controllers, correct unavailable-feature response, and synthetic reading rejection |
| Packaged application | Production frontend and executable Java JAR built successfully |
| Browser workflows | Three tests passed: complete patient/staff care workflow, private message/reply and task workflow, and existing motion/navigation |
| Responsive layout | Eleven main pages checked at 375, 768, and 1440 pixels without document-level horizontal overflow; the three new care surfaces were also exercised as a patient |
| Browser JavaScript errors | None during successful walkthroughs |
| Blank measurements | Browser check confirms reading inputs start empty |
| Backup recovery / restart | Stopped the Java process, copied its embedded database to an isolated restore directory, started the rebuilt JAR, and matched patients, care summaries, appointments, messages, threads, tasks, alerts, and benchmarks against the saved snapshot |
| Latest packaged communication workflow | Passed again after database foreign-key and account-status changes |

GitHub Actions repeats the full build, backend tests, CSV check, browser workflows, and application restart persistence check. CI explicitly enables practice tools to exercise the preserved coursework features; normal deployments leave them disabled.

Screenshots are generated under ignored `frontend/test-results/` and contain synthetic accounts. No database, test account, credentials, or messages are committed to Git.

The local Docker daemon was unavailable, so a local container build is not claimed. Public hosting has not been activated because the hosting provider/account is still unspecified. Durable embedded H2 needs one Java instance and a persistent disk. Automated risk rules remain unvalidated for clinical decisions.
