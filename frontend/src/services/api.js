const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");
const validAnalysis = (data) =>
  data &&
  Number.isFinite(data.health_score) &&
  data.health_score >= 0 &&
  data.health_score <= 100 &&
  ["Healthy", "Needs Attention", "High Risk"].includes(data.risk_level) &&
  ["heart_rate", "blood_pressure", "spo2", "temperature", "glucose"].every(
    (key) => {
      const item = data.results?.[key];
      return (
        item &&
        ["Normal", "Warning", "Critical"].includes(item.status) &&
        Number.isFinite(item.score) &&
        typeof item.message === "string" &&
        ["string", "number"].includes(typeof item.value)
      );
    },
  );
const validRun = (data) =>
  validAnalysis(data) &&
  Number.isFinite(data.total_ms) &&
  data.total_ms > 0 &&
  Array.isArray(data.tasks) &&
  data.tasks.length === 5 &&
  new Set(data.tasks.map((task) => task.parameter)).size === 5 &&
  data.tasks.every(
    (task) =>
      task.parameter in data.results &&
      Number.isFinite(task.start_ms) &&
      Number.isFinite(task.end_ms) &&
      Number.isFinite(task.duration_ms) &&
      task.start_ms >= 0 &&
      task.duration_ms >= 0 &&
      task.end_ms >= task.start_ms,
  );
async function request(path, body, validate = () => true) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      const detail = Array.isArray(data.detail)
        ? data.detail.map((item) => item.msg).join(" ")
        : data.detail;
      throw new Error(
        detail || "The server could not complete this request. Please retry.",
      );
    }
    if (!validate(data))
      throw new Error(
        "The server returned an unexpected response. Please retry.",
      );
    return data;
  } catch (error) {
    if (error instanceof TypeError || error.name === "AbortError")
      throw new Error(
        "Unable to connect to the healthcare analysis server. Check that the backend is running and retry.",
      );
    if (error instanceof SyntaxError)
      throw new Error("The server returned an invalid response. Please retry.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
export const api = {
  health: () => request("/api/health", null, (data) => data?.status === "ok"),
  analyze: (patient) => request("/api/analyze", patient, validAnalysis),
  run: (mode, patient) =>
    request(
      `/api/analyze/${mode}`,
      patient,
      mode === "compare"
        ? (data) =>
            validRun(data?.sequential) &&
            validRun(data?.parallel) &&
            Number.isFinite(data.speedup) &&
            Number.isFinite(data.improvement_percent)
        : validRun,
    ),
  save: (patient) =>
    request("/api/patients", patient, (data) => Number.isInteger(data?.id)),
  history: () =>
    request(
      "/api/patients",
      null,
      (data) =>
        Array.isArray(data) &&
        data.every(
          (item) => Number.isInteger(item.id) && typeof item.name === "string",
        ),
    ),
  record: (id) =>
    request(
      `/api/patients/${id}`,
      null,
      (data) => Number.isInteger(data?.id) && validAnalysis(data.analysis),
    ),
};
