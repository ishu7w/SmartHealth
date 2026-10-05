# College demonstration — 8–10 minutes

Use synthetic information only. Start the combined application and sign in with the administrator you configured. Create a doctor account and keep its credentials private.
For classroom demonstrations, explicitly set `PRACTICE_TOOLS=true` before starting the server. Normal deployments leave it false; synthetic seeding, simulation, and benchmark endpoints are unavailable in that mode.

## Preparation

1. On Dashboard, select **Add demo patients**. Three synthetic profiles receive six readings each. Repeating the action skips the same names.
2. Open Patients and review the risk categories and histories. Demo readings are marked as simulation.
3. Register a separate patient in a private browser window and create a profile. This account demonstrates ownership restrictions.
4. Keep the administrator and patient in separate browser profiles/windows rather than switching accounts mid-presentation.

## Presentation sequence

| Time | Screen/action | Point to explain |
|---|---|---|
| 0–1 min | Dashboard and patient directory | SDG 3, organized health information, synthetic data |
| 1–2 min | Patient Analysis: save 75 bpm, 115/75 mmHg, 36.8°C, 98%, glucose 90, breathing 16 | Validated input, persistent history, six-rule analysis |
| 2–3 min | Save another reading at 88% oxygen; open Alerts | Critical override prevents an isolated signal being hidden by averages |
| 3–4 min | Care record: add synthetic allergy/notes and an example medication list entry | Practical portal features inspired by MyChart/NHS, clear source labels, no diagnosis/prescribing |
| 4–5 min | Request a visit; assigned doctor confirms; export calendar | Patient/staff workflow, conflict prevention, timezone handling |
| 5–6 min | Monitoring: generate a few readings, then pause | Synthetic continuous input, saved alerts, no background medical-device monitoring |
| 6–8 min | Processing: compare sizes 100, 500, 1000, 5000, 10000 with same seed/thread count | ExecutorService, Futures, actual elapsed time, checksum equality, scheduling overhead |
| 8–9 min | Trends, CSV download, Print/save PDF | Usable records and portable summaries; simulation excluded by default |
| 9–10 min | About/architecture and verification | Single Java process, embedded durable database, roles, automated testing, limits |

## Capture real benchmark results

Set the server administrator credentials in your shell and run:

```sh
APP_URL=http://localhost:8080 \
E2E_ADMIN_EMAIL='your-admin-email' \
E2E_ADMIN_PASSWORD='your-admin-password' \
node scripts/prepare-demo.mjs
```

This adds synthetic demo profiles, runs actual comparisons for all five dataset sizes using four threads and seed 42, and saves `demo-output/benchmarks.csv` plus `demo-output/benchmarks.json`. The output folder is ignored by Git. There are no hardcoded performance results. Record the host CPU and thread count, and explain that one run is not a statistical performance study.

## Questions to be ready for

- **Why can parallel be slower?** Pool creation, task scheduling, memory access, and JIT/host load can dominate small workloads.
- **What is actually concurrent?** One independent patient record per Callable, submitted to a fixed thread pool; all Futures are collected.
- **How do you know both approaches do the same work?** They consume the same immutable dataset and must produce matching full-width result checksums.
- **Is this a clinical system?** No. The rules, simulation, accounts, and appointments demonstrate software workflows; there is no real clinic/device integration.
- **Where is data stored?** An embedded H2 file on a persistent disk; the browser keeps only its session cookie.
- **What happens after a restart?** The account must sign in again, but its saved clinical/demo information remains. The verification workflow tests this.

Screenshots are generated under `frontend/test-results/` by the browser suite: desktop overview, mobile patients/care record, and desktop appointments. They contain only synthetic test information.
