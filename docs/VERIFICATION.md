# Rebuild verification — 21 September 2026

The rebuilt project was checked locally using Java 21 and Chrome. Test records and accounts were synthetic and are not included in Git.

| Check | Result |
|---|---|
| Spring integration suite, H2 | 11 tests passed, no failures or errors |
| Same integration suite, isolated MySQL 9.6 | 11 tests passed, no failures or errors |
| All dataset sizes, 100 through 10,000 | Sequential and parallel checksums matched; all records processed; active workers returned to zero |
| Combined React + Spring Boot executable JAR | Built and started successfully |
| Packaged application browser workflow | Passed: patient registration/profile/reading/alerts, staff management, monitoring, actual comparison |
| Responsive pages | Seven core pages checked at 375, 768, and 1440px; no document-level horizontal overflow |
| Motion and mobile navigation | Passed: default animation mode, pause control, mobile menu, guarded-route navigation |
| Browser JavaScript errors | None in the successful walkthroughs |
| Existing visual foundation | Original public artwork, main stylesheet, ambient animation, Lenis implementation, and motion utilities preserved |

The browser suite contains two tests and was run against the combined app on port 8080; the main workflow was also checked through the development proxy on port 5173. Performance results are generated and persisted at runtime, not copied into fixtures or presented as universal speedup claims.

Docker configuration is provided, but the local Docker daemon was unavailable, so a local container build was not claimed. The Java/MySQL application, frontend production build, combined JAR, and real browser workflows were verified directly. GitHub Actions is configured to repeat integration tests on MySQL 8.4 and run the packaged application through the browser suite.
