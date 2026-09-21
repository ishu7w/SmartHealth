# REST API

All endpoints use `/api`. Dates are UTC ISO-8601. JSON responses never contain password hashes. Database IDs are numeric; public patient IDs have a `P-` prefix. History lists return newest first, limited to 100 rows unless noted. Use the same origin as the frontend.

## Authentication

1. `GET /auth/csrf` returns `{ "token": "…", "headerName": "X-CSRF-TOKEN" }` and establishes a session.
2. Include that header with the returned token for every POST/PUT/DELETE.
3. `POST /auth/login` uses URL-encoded `username=email&password=...` and returns `{ "ok": true }`. Retain cookies.
4. Fetch a fresh CSRF token after login, because authentication rotates it.
5. `GET /auth/me` returns the account. `POST /auth/logout` clears the session (204).

`POST /auth/register` accepts `{ "name", "email", "password" }`. Password length is 12–72 characters. It creates a patient account (201); login separately afterward. Registration never accepts a staff role.

## Endpoints and access

| Method | Path | Access / behavior |
|---|---|---|
| GET | `/health` | Public liveness/runtime information |
| GET | `/patients?search=...` | Patient: own profile; staff: all. Name/public-ID search. Includes latestReading. |
| POST | `/patients` | Patient: own profile once; staff: unlinked patient profile |
| GET, PUT | `/patients/{id}` | Patient owner or staff |
| DELETE | `/patients/{id}` | Administrator; transactionally removes profile, readings, alerts |
| GET | `/health-records` | Latest visible 100 records |
| POST | `/health-records` | Owner or staff; analyzes, persists, generates alerts |
| GET | `/health-records/patient/{id}` | Latest 100 readings for authorized patient |
| GET | `/health-records/latest/{id}` | Most recent reading, 404 if none |
| GET | `/alerts` | Latest 100 visible alerts |
| GET | `/alerts/critical` | Critical subset of latest 100 visible alerts |
| PUT | `/alerts/{id}/acknowledge` | Doctor/admin; New → Acknowledged |
| PUT | `/alerts/{id}/resolve` | Doctor/admin; unresolved → Resolved |
| GET | `/dashboard/statistics` | Visible patient/risk/alert totals; staff also sees processing summary |
| POST | `/process/sequential` | Doctor/admin; real sequential execution |
| POST | `/process/parallel` | Doctor/admin; real thread-pool execution |
| POST | `/process/compare` | Doctor/admin; same dataset in both modes, equality check |
| GET | `/process/benchmarks` | Doctor/admin; latest 100 measurements |
| GET | `/process/system` | Doctor/admin; JVM CPU/load/heap/active task information |
| GET, POST | `/admin/doctors` | Admin: list/create doctors (registration-shaped body) |
| PUT | `/admin/doctors/{id}/enabled` | Admin: `{ "enabled": false }` revokes access |

## Payload examples

Patient:

```json
{"name":"Synthetic Patient","age":28,"gender":"Female","bloodGroup":"O+","height":165,"weight":60,"phone":"","emergencyContact":""}
```

Vital signs (Celsius, bpm, mmHg, %, mg/dL, breaths/min):

```json
{"patientId":1,"heartRate":75,"systolicBP":115,"diastolicBP":75,"temperature":36.8,"spo2":98,"glucose":90,"respiratoryRate":16,"simulated":false}
```

Measurement response contains the persisted fields, ID, timestamp, `riskScore`, and `healthStatus`. Systolic must exceed diastolic pressure. Numeric limits are enforced on the server.

Benchmark:

```json
{"numberOfRecords":1000,"threadCount":4,"seed":42}
```

Supported counts: 100, 500, 1000, 5000, 10000. Threads: 1–32. The response has `summary`, `sequential`, `parallel`, `availableProcessors`, and `workload`. A mode that was not run is null. Each run provides `totalMs`, `cpuMs`, `checksum`, `processed`, and up to 100 task intervals. Checksums are strings for lossless JavaScript transport. The summary persists the actual measurements; speedup/timeSaved are null for single-mode runs.

## Error behavior

- 400: invalid body, validation failure, unsupported dataset size, inconsistent BP.
- 401: missing/invalid session or disabled account.
- 403: missing CSRF token, role restriction, another patient's data.
- 404: unknown patient/alert or no latest reading.
- 409: duplicate account/profile, resolved alert transition, benchmark already running.
- 500: unexpected server failure; no fabricated fallback result.

Application errors include a readable `message`. Framework authorization responses can be empty; the UI provides a fallback message. An expired session requires signing in again.
