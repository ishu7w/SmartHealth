import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { request } from "../services/api";
import {
  Field,
  useResource,
  ResourceState,
  ReadingsTable,
  vitalFields,
  normalVitals,
} from "../components/DataViews";
import {
  PageHeading,
  ErrorNotice,
  Loading,
  HealthScore,
  Disclaimer,
} from "../components/UI";
export default function PatientAnalysis() {
  const [query] = useSearchParams();
  const patients = useResource("/patients");
  const [patientId, setPatientId] = useState(query.get("patient") || ""),
    [vitals, setVitals] = useState(normalVitals),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const history = useResource(
    patientId ? `/health-records/patient/${patientId}` : null,
  );
  useEffect(() => {
    if (!patientId && patients.data?.length)
      setPatientId(String(patients.data[0].id));
  }, [patients.data, patientId]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const record = await request("/health-records", "POST", {
        ...Object.fromEntries(
          Object.entries(vitals).map(([k, v]) => [k, Number(v)]),
        ),
        patientId: Number(patientId),
        simulated: false,
      });
      setResult(record);
      history.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-stack">
      <PageHeading
        title="Understand your signals."
        description="Enter six vital signs. Save a reading and review its educational risk assessment."
      />
      <ResourceState resource={patients}>
        {patients.data?.length ? (
          <>
            <section className="panel">
              <div className="section-heading">
                <h2>Patient measurements</h2>
                <span className="sample-label">Rule-based analysis</span>
              </div>
              <form className="form-grid" onSubmit={submit}>
                <Field label="Patient">
                  <select
                    value={patientId}
                    required
                    onChange={(e) => {
                      setPatientId(e.target.value);
                      setResult(null);
                    }}
                    disabled={busy}
                  >
                    {patients.data.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.patientId}
                      </option>
                    ))}
                  </select>
                </Field>
                {vitalFields.map(([key, label, min, max, step]) => (
                  <Field
                    key={key}
                    label={label}
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    required
                    value={vitals[key]}
                    onChange={(e) =>
                      setVitals({ ...vitals, [key]: e.target.value })
                    }
                    disabled={busy}
                  />
                ))}
                <div className="form-actions">
                  <button className="button" disabled={busy}>
                    {busy ? (
                      <Loading text="Analyzing and saving" />
                    ) : (
                      "Analyze & save reading"
                    )}
                  </button>
                </div>
              </form>
              {error && <ErrorNotice message={error} />}
            </section>
            {result && (
              <section className="panel" aria-live="polite">
                <HealthScore
                  score={result.riskScore}
                  risk={result.healthStatus}
                />
                <p>
                  Reading saved. Any threshold alerts are available in{" "}
                  <Link to="/alerts">Alerts</Link>.
                </p>
              </section>
            )}
            <section className="panel">
              <h2>Health history</h2>
              <p>Most recent 100 readings for the selected patient.</p>
              <ResourceState resource={history}>
                <ReadingsTable records={history.data || []} />
              </ResourceState>
            </section>
          </>
        ) : (
          <section className="panel">
            <h2>A profile comes first.</h2>
            <p>Create a patient profile before entering health measurements.</p>
            <Link className="button" to="/patients">
              Create patient profile
            </Link>
          </section>
        )}
      </ResourceState>
      <Disclaimer />
    </div>
  );
}
