import { cloneElement, useEffect, useId, useState } from "react";
import { request } from "../services/api";
import { ErrorNotice, Loading, StatusBadge } from "./UI";

export function useResource(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }
    request(path)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, revision]);
  return { data, error, loading, reload: () => setRevision((n) => n + 1) };
}
export function ResourceState({ resource, children }) {
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorNotice message={resource.error} retry={resource.reload} />;
  return children;
}
export const when = (value) => new Date(value).toLocaleString();
export function ReadingsTable({ records = [] }) {
  if (!records.length)
    return (
      <p className="empty-state">
        No readings yet. Add a reading to begin a health history.
      </p>
    );
  return (
    <div className="table-scroll" tabIndex={0} aria-label="Health readings">
      <table>
        <thead>
          <tr>
            {[
              "Patient",
              "Recorded",
              "Heart rate",
              "Blood pressure",
              "SpO₂",
              "Temperature",
              "Glucose",
              "Breathing",
              "Risk",
              "Source",
            ].map((x) => (
              <th key={x}>{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>#{r.patientId}</td>
              <td>{when(r.createdAt)}</td>
              <td>{r.heartRate} bpm</td>
              <td>
                {r.systolicBP}/{r.diastolicBP} mmHg
              </td>
              <td>{r.spo2}%</td>
              <td>{r.temperature} °C</td>
              <td>{r.glucose} mg/dL</td>
              <td>{r.respiratoryRate}/min</td>
              <td>
                <StatusBadge status={r.healthStatus} />
                <small>{r.riskScore}/100</small>
              </td>
              <td>{r.simulated ? "Simulation" : "Entered"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Field({ label, children, ...props }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children ? cloneElement(children, { id }) : <input id={id} {...props} />}
    </div>
  );
}
export const vitalFields = [
  ["heartRate", "Heart rate (bpm)", 20, 250, 1],
  ["systolicBP", "Systolic pressure (mmHg)", 50, 250, 1],
  ["diastolicBP", "Diastolic pressure (mmHg)", 30, 160, 1],
  ["temperature", "Temperature (°C)", 30, 43, 0.1],
  ["spo2", "Oxygen saturation (%)", 50, 100, 0.1],
  ["glucose", "Blood glucose (mg/dL)", 20, 600, 1],
  ["respiratoryRate", "Respiratory rate (/min)", 5, 60, 1],
];
export const normalVitals = {
  heartRate: 75,
  systolicBP: 115,
  diastolicBP: 75,
  temperature: 36.8,
  spo2: 98,
  glucose: 90,
  respiratoryRate: 16,
};
