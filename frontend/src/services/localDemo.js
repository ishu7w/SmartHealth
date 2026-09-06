const DELAYS = [200, 240, 180, 220, 160];
const STORAGE_KEY = "smarthealth:analyses";

const result = (value, status, message) => ({
  value,
  status,
  message,
  score: { Normal: 100, Warning: 65, Critical: 25 }[status],
});

export function analyzeLocal(patient) {
  const heartStatus =
    patient.heart_rate >= 60 && patient.heart_rate <= 100
      ? "Normal"
      : patient.heart_rate >= 50 && patient.heart_rate <= 120
        ? "Warning"
        : "Critical";
  const pressureStatus =
    patient.systolic_bp < 80 ||
    patient.diastolic_bp < 50 ||
    patient.systolic_bp >= 180 ||
    patient.diastolic_bp >= 120
      ? "Critical"
      : patient.systolic_bp >= 90 &&
          patient.systolic_bp < 120 &&
          patient.diastolic_bp >= 60 &&
          patient.diastolic_bp < 80
        ? "Normal"
        : "Warning";
  const oxygenStatus =
    patient.spo2 >= 95 ? "Normal" : patient.spo2 >= 90 ? "Warning" : "Critical";
  const temperatureStatus =
    patient.temperature >= 97 && patient.temperature <= 99.5
      ? "Normal"
      : patient.temperature >= 95 && patient.temperature <= 102.2
        ? "Warning"
        : "Critical";
  const glucoseStatus =
    patient.glucose >= 70 && patient.glucose < 100
      ? "Normal"
      : patient.glucose >= 54 && patient.glucose < 180
        ? "Warning"
        : "Critical";
  const results = {
    heart_rate: result(
      patient.heart_rate,
      heartStatus,
      heartStatus === "Normal"
        ? "Within the demo resting range (60–100 BPM)."
        : "Outside the demo resting heart-rate range.",
    ),
    blood_pressure: result(
      `${patient.systolic_bp} / ${patient.diastolic_bp}`,
      pressureStatus,
      "Demo reference: 90–119 / 60–79 mmHg. Both values are evaluated.",
    ),
    spo2: result(
      patient.spo2,
      oxygenStatus,
      oxygenStatus === "Normal"
        ? "Within the demo oxygen range (95–100%)."
        : "Below the demo oxygen reference range.",
    ),
    temperature: result(
      patient.temperature,
      temperatureStatus,
      "Demo reference: 97–99.5°F. Temperature is entered in Fahrenheit.",
    ),
    glucose: result(
      patient.glucose,
      glucoseStatus,
      "Demo fasting reference: 70–99 mg/dL. Meal timing affects real readings.",
    ),
  };
  const values = Object.values(results);
  const score = Math.round(values.reduce((sum, item) => sum + item.score, 0) / values.length);
  const symptoms = patient.symptoms || [];
  const highRisk =
    values.some((item) => item.status === "Critical") ||
    symptoms.some((item) => ["Chest Pain", "Breathing Difficulty"].includes(item));
  const risk = highRisk
    ? "High Risk"
    : symptoms.length || values.some((item) => item.status === "Warning")
      ? "Needs Attention"
      : "Healthy";
  return {
    health_score: score,
    risk_level: risk,
    results,
    symptoms,
    symptom_note: symptoms.length
      ? "Reported symptoms affect the overall status, not the numeric vital score."
      : "No symptoms reported.",
  };
}

function readRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

export function saveLocal(patient) {
  const analysis = analyzeLocal(patient);
  const record = {
    ...patient,
    ...analysis,
    id: Date.now(),
    created_at: new Date().toISOString(),
  };
  const records = [record, ...readRecords()].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return record;
}

export function historyLocal() {
  return readRecords();
}

export function recordLocal(id) {
  const record = readRecords().find((item) => item.id === Number(id));
  return record ? { ...record, analysis: analyzeLocal(record) } : null;
}

function runLocal(patient, mode) {
  const analysis = analyzeLocal(patient);
  const total = mode === "parallel" ? Math.max(...DELAYS) : DELAYS.reduce((a, b) => a + b, 0);
  let cursor = 0;
  const tasks = DELAYS.map((delay, index) => {
    const start = mode === "parallel" ? 0 : cursor;
    if (mode === "sequential") cursor += delay;
    const parameter = ["heart_rate", "blood_pressure", "spo2", "temperature", "glucose"][index];
    return {
      parameter,
      duration_ms: delay,
      start_ms: start,
      end_ms: start + delay,
      worker: mode === "parallel" ? `health-worker_${index}` : "MainThread",
      result: analysis.results[parameter],
    };
  });
  return {
    ...analysis,
    mode,
    total_ms: total,
    tasks,
    simulated_workload: true,
    worker_count: mode === "parallel" ? 5 : 1,
  };
}

export function runLocalAnalysis(mode, patient) {
  if (mode === "compare") {
    const sequential = runLocal(patient, "sequential");
    const parallel = runLocal(patient, "parallel");
    return {
      sequential,
      parallel,
      speedup: sequential.total_ms / parallel.total_ms,
      improvement_percent: (1 - parallel.total_ms / sequential.total_ms) * 100,
    };
  }
  return runLocal(patient, mode);
}
