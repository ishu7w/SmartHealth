import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../services/api";
import {
  Field,
  useResource,
  ResourceState,
  ReadingsTable,
  normalVitals,
} from "../components/DataViews";
import {
  PageHeading,
  ErrorNotice,
  StatusBadge,
  Disclaimer,
} from "../components/UI";
import HealthChart from "../components/HealthChart";

export default function Monitoring() {
  const patients = useResource("/patients");
  const [patientId, setPatientId] = useState(""),
    [running, setRunning] = useState(false),
    [scenario, setScenario] = useState("mixed"),
    [rows, setRows] = useState([]),
    [error, setError] = useState("");
  useEffect(() => {
    if (!patientId && patients.data?.length)
      setPatientId(String(patients.data[0].id));
  }, [patientId, patients.data]);
  useEffect(() => {
    if (!running || !patientId) return;
    let stopped = false,
      timer;
    async function tick() {
      const critical =
        scenario === "critical" ||
        (scenario === "mixed" && Math.random() < 0.2);
      const vitals = {
        ...normalVitals,
        heartRate: 65 + Math.floor(Math.random() * (critical ? 65 : 30)),
        spo2: critical
          ? 86 + Math.floor(Math.random() * 4)
          : 95 + Math.floor(Math.random() * 6),
        temperature: Number(
          (critical
            ? 38.5 + Math.random()
            : 36.2 + Math.random() * 1.2
          ).toFixed(1),
        ),
        systolicBP: 100 + Math.floor(Math.random() * 35),
        diastolicBP: 65 + Math.floor(Math.random() * 20),
        glucose: 75 + Math.floor(Math.random() * 35),
        respiratoryRate: 12 + Math.floor(Math.random() * 10),
      };
      try {
        const row = await request("/health-records", "POST", {
          ...vitals,
          patientId: Number(patientId),
          simulated: true,
        });
        if (!stopped) setRows((previous) => [...previous.slice(-29), row]);
      } catch (e) {
        if (!stopped) {
          setError(e.message);
          setRunning(false);
        }
      }
      // Start the next request only after this request completes; no overlapping writes.
      if (!stopped) timer = setTimeout(tick, 4000);
    }
    // A short initial delay lets StrictMode clean up its first effect without saving twice.
    timer = setTimeout(tick, 200);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [running, patientId, scenario]);
  const latest = rows.at(-1);
  return (
    <div className="page-stack">
      <PageHeading
        title="Health, in motion."
        description="A live educational simulation. Each generated reading is saved to the selected patient’s history."
      />
      <section className="panel">
        <div className="section-heading">
          <h2>Monitoring simulation</h2>
          <StatusBadge status={running ? "Running" : "Paused"} />
        </div>
        <ResourceState resource={patients}>
          {patients.data?.length ? (
            <div className="form-grid">
              <Field label="Patient">
                <select
                  disabled={running}
                  value={patientId}
                  onChange={(e) => {
                    setPatientId(e.target.value);
                    setRows([]);
                  }}
                >
                  {patients.data.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.patientId}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Simulation scenario">
                <select
                  value={scenario}
                  disabled={running}
                  onChange={(e) => setScenario(e.target.value)}
                >
                  <option value="mixed">Mixed readings</option>
                  <option value="stable">Mostly stable</option>
                  <option value="critical">
                    Critical oxygen demonstration
                  </option>
                </select>
              </Field>
              <button
                className="button"
                onClick={() => {
                  setError("");
                  setRunning(!running);
                }}
              >
                {running ? "Pause simulation" : "Start simulation"}
              </button>
            </div>
          ) : (
            <p>
              Create a <Link to="/patients">patient profile</Link> to start
              monitoring.
            </p>
          )}
        </ResourceState>
        <p className="muted">
          Synthetic values, approximately every four seconds. Pause stops future
          requests; an in-flight reading can still finish saving. No background
          monitoring after leaving this page.
        </p>
        {error && <ErrorNotice message={error} />}
        {latest && (
          <div className="stats-grid">
            {[
              ["Heart rate", `${latest.heartRate} bpm`],
              ["Oxygen", `${latest.spo2}%`],
              ["Temperature", `${latest.temperature} °C`],
              ["Blood pressure", `${latest.systolicBP}/${latest.diastolicBP}`],
            ].map(([label, value]) => (
              <div className="stat-cell" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Oxygen saturation</h2>
          {latest && <StatusBadge status={latest.healthStatus} />}
        </div>
        {rows.length ? (
          <HealthChart
            data={rows.map((r) => ({
              ...r,
              time: new Date(r.createdAt).toLocaleTimeString(),
            }))}
            metric={{
              key: "spo2",
              label: "Oxygen saturation",
              unit: "%",
              color: "#d2e5b0",
              domain: [80, 100],
            }}
          />
        ) : (
          <p className="empty-state">
            Start a simulation to see a live signal.
          </p>
        )}
        <Link className="text-button" to="/alerts">
          Review generated alerts
        </Link>
      </section>
      <section className="panel">
        <h2>This session’s readings</h2>
        <ReadingsTable records={[...rows].reverse()} />
      </section>
      <Disclaimer />
    </div>
  );
}
