# Integrated Smart Healthcare Computing Solution

**SmartHealth** is a complete academic PBL for **Computer Architecture and Parallel Processing**. It demonstrates healthcare parameter analysis, simulated monitoring, sequential execution, concurrent execution with worker threads, and measured speedup.

This is an educational prototype, not a clinical system. No authentication, machine learning, connected medical sensors, or medical recommendations are included.

## Features

- **Dashboard:** clearly labeled sample vitals, selectable overview charts, actual API/database connection status, and links into the two main workflows.
- **Patient Analysis:** validated patient/vital form, symptom checkboxes, individual rule results, overall score and risk status, explicit SQLite save, recent history, and record detail expansion.
- **Health Monitoring:** synthetic readings every three seconds, pause/resume, three responsive trend charts, maximum 20 retained readings.
- **Parallel Processing:** sequential, parallel, and comparison runs; backend-measured task start/end/durations; common-scale timelines; five worker lanes; optional measured replay at quarter speed; comparison bar chart, speedup, and time reduction.
- **About:** objectives, workflow, stack, core concepts, and API documentation link.
- Responsive navigation and layouts, keyboard focus, reduced-motion support, loading/error/empty/success states, retry actions, and centralized API calls.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS 4, Lucide React, Recharts |
| Motion | GSAP SplitText, CustomEase, Flip, DrawSVGPlugin and Lenis (reduced-motion alternatives) |
| Backend | Python 3.10+, FastAPI, Pydantic, Uvicorn |
| Concurrency | Standard-library `concurrent.futures.ThreadPoolExecutor` |
| Storage | Standard-library SQLite |
| Verification | Python unittest, urllib API smoke checks, Playwright with local Chrome |

The interface follows the supplied Observe reference: dark liquid glass, monochrome controls, locally bundled Instrument Serif headlines, and the original background artwork with a slow, centered GSAP zoom (2.5% over 50 seconds). GSAP animates headlines, sections, selections, diagrams, values, and saved-record expansion. The Pause motion control and OS reduced-motion preference preserve a static, usable experience. Dark, opaque work surfaces and larger text improve readability without costly live backdrop blur. The app remains functional on a black canvas if the background image cannot load.

## Architecture

```text
React UI → centralized API client → FastAPI / Pydantic
                                  ├─ Five independent rule functions → score + status
                                  ├─ Sequential runner → measured task timings
                                  ├─ ThreadPoolExecutor(5) → measured task timings
                                  └─ Explicit save → SQLite → recent/detail endpoints

Monitoring: browser-only simulated readings → capped history → Recharts
```

The dashboard uses illustrative data. API status is a real health check. Demo execution results always come from the backend, never fixed numbers or fabricated frontend timing.

## Folder structure

```text
.
├── frontend/
│   ├── src/
│   │   ├── components/       # Layout, vitals, chart, history, smooth scroll, shared UI
│   │   ├── pages/            # Dashboard, analysis, monitoring, parallel demo, about
│   │   ├── services/api.js   # All JSON API calls and response validation
│   │   ├── data/sampleData.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tests/browser-check.mjs
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── analysis/             # Heart, pressure, oxygen, temperature, glucose, score
│   ├── parallel/             # Timed workload, sequential and concurrent runners
│   ├── database/database.py  # Table creation and parameterized persistence
│   ├── tests/                # Rule/scheduling tests and API smoke test
│   ├── main.py
│   ├── schemas.py
│   └── requirements.txt
├── PRODUCT.md
├── DESIGN.md
└── .impeccable/              # Design concepts, review, and verification screenshots
```

## Installation and running

Prerequisites: Python 3.10 or later and a current Node.js LTS with npm. The build was verified with Python 3.14 and Node.js 25.8.

Open **two terminals** in the project folder.

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

On Windows, activate with `.venv\Scripts\activate` and use `python` instead of `python3` where needed.

The SQLite table is created automatically during startup. Its default location is `backend/database/healthcare.db`. No migrations or manual seed step is needed. The history starts empty until a record is saved.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [SmartHealth](http://localhost:5173). API documentation is available at [FastAPI Swagger UI](http://localhost:8000/docs).

### Environment options

- Copy `frontend/.env.example` to `frontend/.env` only if changing the backend URL. `VITE_API_URL` defaults to `http://localhost:8000`. Restart Vite after changing it.
- Backend `CORS_ORIGINS` is a comma-separated list; defaults include localhost and 127.0.0.1 on ports 5173 (dev) and 4173 (preview).
- Backend `SMARTHEALTH_DB` overrides the database file path, useful for isolated tests.
- For another device on the LAN, expose Uvicorn on `0.0.0.0`, point `VITE_API_URL` to the server's LAN address, and add the frontend LAN origin to CORS. Browser `localhost` refers to the device opening the page.
- The app has no authentication by design. Use synthetic data for classroom demonstrations.

### Production build

```bash
cd frontend
npm run build
npm run preview
```

The built frontend is in `frontend/dist`. Preview normally uses port 4173, which is included in the default backend CORS origins. A production static host needs an SPA fallback to `index.html` for React Router routes. The backend is a separate process.

## Suggested one-minute demonstration

1. Open Dashboard: explain that displayed vitals are labeled sample data.
2. Open Patient Analysis → Use sample data → Analyze Health. Show five transparent results and the score.
3. Select Save Analysis, then open the saved row to demonstrate SQLite persistence.
4. Open Parallel Processing → Run Comparison. Point out sequential stair-step timing versus concurrent task starts.
5. Explain speedup and time reduced; replay the measured worker schedule.
6. Open Health Monitoring and pause/resume the explicitly simulated stream.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/` | API identity |
| GET | `/api/health` | Server and SQLite connection status |
| POST | `/api/analyze` | Fast rule-based analysis without artificial delays |
| POST | `/api/analyze/sequential` | Sequential demo with per-task delay/timing |
| POST | `/api/analyze/parallel` | Five-worker concurrent demo with delay/timing |
| POST | `/api/analyze/compare` | Sequential, then parallel, plus measured formulas |
| POST | `/api/patients` | Recompute trusted result and save submitted patient; returns 201 |
| GET | `/api/patients` | Latest 20 records; UI displays up to 8 |
| GET | `/api/patients/{id}` | Saved patient and complete analysis; 404 if absent |

All POST routes accept the same patient structure:

```json
{
  "name": "Demo Patient",
  "age": 28,
  "gender": "Female",
  "heart_rate": 72,
  "systolic_bp": 118,
  "diastolic_bp": 78,
  "spo2": 98,
  "temperature": 98.6,
  "glucose": 96,
  "symptoms": []
}
```

Gender accepts Female, Male, Other, or Prefer not to say. Symptoms accept Fever, Headache, Chest Pain, Breathing Difficulty, Fatigue, and Dizziness. Names are trimmed; age, vital bounds, and systolic greater than diastolic are validated on the backend. Invalid submissions return HTTP 422. The save endpoint accepts input parameters, not a client-supplied score, and recomputes the score before persistence.

Each individual result contains `value`, `status`, `message`, and `score`. Demo results additionally contain exact floating-point `total_ms`, per-task `duration_ms`, `start_ms`, `end_ms`, actual thread names, worker count, and `simulated_workload: true`.

## Educational analysis rules

These deliberately simplified thresholds are **teaching examples, not medical guidance**. They do not account for individual context, age, medications, pregnancy, altitude, activity, or measurement quality. Age and gender are stored context and do not modify these rules.

| Parameter | Normal demo range | Warning demo range | Critical demo range |
| --- | --- | --- | --- |
| Heart rate | 60–100 BPM | 50–59.99 or 100.01–120 | Below 50 or above 120 |
| Blood pressure | Systolic 90–119.99 **and** diastolic 60–79.99 | Any other noncritical combination | Systolic below 80 or ≥180; diastolic below 50 or ≥120 |
| SpO₂ | ≥95% | 90 to below 95% | Below 90% |
| Temperature | 97–99.5°F | 95 to below 97; above 99.5 through 102.2°F | Below 95 or above 102.2°F |
| Fasting glucose | 70 to below 100 mg/dL | 54 to below 70; 100 to below 180 | Below 54 or ≥180 |

Normal = 100, Warning = 65, Critical = 25. **Overall score is the rounded arithmetic mean of the five scores.** The normal sample scores 100, consistent with these rules.

Risk is High Risk if any vital is Critical or if Chest Pain/Breathing Difficulty is reported. Otherwise any warning or reported symptom produces Needs Attention; otherwise Healthy. This prevents a critical individual result from being hidden by a high average. Symptoms affect status but do not change the numeric vital score.

## Parallel processing and academic integrity

Both runners execute the same five functions using the same input and ordered delay list: 200, 240, 180, 220, and 160 ms. Delays exist only in `parallel/workload.py`; ordinary analysis calls the rule functions directly.

Sequential calls each timed task in order. Parallel submits them to `ThreadPoolExecutor(max_workers=5)` and joins all futures. The timer includes pool startup, waiting, result collection, and shutdown. Per-task timings cover the task's own delay plus rule execution. Start/end offsets share the run's timer origin.

`time.sleep` simulates waiting work and releases the Python GIL. The observed reduction demonstrates concurrency for independent wait-heavy workloads. It is **not** a universal claim that Python threads parallelize CPU-bound Python calculations. OS threads are not dedicated physical CPU cores. The UI makes this distinction explicit.

```text
Speedup = Sequential Time / Parallel Time
Time Reduced (%) = (1 - Parallel Time / Sequential Time) × 100
```

Run Comparison performs sequential first, then parallel, in one backend request. Values change with scheduling and system load. The UI never promises a fixed speedup. The optional animation is a **quarter-speed replay of measured timestamps**, not live processor telemetry.

## Storage

One `patient_analysis` table stores id, name, age, gender, six numeric vital fields, symptoms (JSON text), health_score, risk_level, and UTC created_at. SQL writes and lookups are parameterized. Database failures return a friendly HTTP 503 message. Restarting the backend preserves records. Do not commit the SQLite database.

## Verification

Backend rule and scheduling tests:

```bash
cd backend
source .venv/bin/activate
python -m unittest discover -s tests -v
```

API smoke test (uses a separate disposable test database):

```bash
cd backend
source .venv/bin/activate
SMARTHEALTH_DB=/tmp/smarthealth-api-qa.db uvicorn main:app --port 8001
```

In another terminal:

```bash
cd backend
.venv/bin/python tests/api_smoke.py
```

`TEST_API_URL` can change the test URL. The smoke test creates a synthetic record in that test database. It covers all nine endpoints, CORS, validation, missing IDs, save/list/detail, result equality, and speedup formulas.

Browser checks require both normal development servers and locally installed Google Chrome:

```bash
cd frontend
node tests/browser-check.mjs
```

The checks cover all five pages at 375/768/1024/1440 pixels, overflow, analysis, save/history/detail, monitoring updates and pause/resume, sequential/parallel/comparison/replay, mobile navigation, offline retry, reduced motion, and browser console errors. They create a synthetic Browser QA Patient record in the running application database.

## Screenshots

Running the browser checks generates local UI captures in `.impeccable/observe-screenshots/`. These generated files are excluded from Git:

- `dashboard-1440.png` and `dashboard-375.png`
- `analysis-1440.png` and `analysis-375.png`
- `parallel-results-1440.png`
- Monitoring, parallel, and about captures at all four requested breakpoints

Use the generated screenshots in the academic report after reviewing them. Browser tests use synthetic patient records.

## Future improvements

Useful academic extensions include CSV export, explicitly separate CPU-bound process-pool experiments, repeated benchmark runs with variance, and configurable educational thresholds. These are future ideas, not present capabilities.

## Educational disclaimer

This application is an educational prototype developed for academic demonstration and is not intended for medical diagnosis or treatment. All readings in demonstrations are synthetic. Scores, statuses, and thresholds are not medical advice.
