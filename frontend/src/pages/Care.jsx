import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { request } from "../services/api";
import {
  Field,
  useResource,
  ResourceState,
  ReadingsTable,
  when,
} from "../components/DataViews";
import { PageHeading, ErrorNotice, Disclaimer } from "../components/UI";
import HealthChart from "../components/HealthChart";
import { exportReadings } from "../lib/download";

const metrics = [
  { key: "heartRate", label: "Heart rate", unit: "bpm" },
  { key: "spo2", label: "Oxygen saturation", unit: "%" },
  { key: "temperature", label: "Temperature", unit: "°C" },
  { key: "glucose", label: "Blood glucose", unit: "mg/dL" },
  { key: "systolicBP", label: "Systolic blood pressure", unit: "mmHg" },
  { key: "diastolicBP", label: "Diastolic blood pressure", unit: "mmHg" },
  { key: "respiratoryRate", label: "Respiratory rate", unit: "/min" },
];
export default function Care() {
  const patients = useResource("/patients"),
    [query] = useSearchParams();
  const [patientId, setPatientId] = useState(query.get("patient") || ""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(false),
    [saved, setSaved] = useState(""),
    [metricKey, setMetricKey] = useState("heartRate"),
    [source, setSource] = useState("entered");
  const summary = useResource(
      patientId ? `/patients/${patientId}/summary` : null,
    ),
    data = summary.data;
  useEffect(() => {
    if (!patientId && patients.data?.length)
      setPatientId(String(patients.data[0].id));
  }, [patients.data, patientId]);
  async function mutate(path, method, body, done) {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      await request(path, method, body);
      done?.();
      summary.reload();
      setSaved("Changes saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const readings = (data?.readings || []).filter(
      (r) => source === "all" || !r.simulated,
    ),
    metric = metrics.find((m) => m.key === metricKey);
  return (
    <div className="page-stack care-page">
      <PageHeading
        title="Your care, together."
        description="Keep your health information ready for your next conversation with a care professional."
      />
      <section className="panel no-print">
        <ResourceState resource={patients}>
          {patients.data?.length ? (
            <Field label="Patient">
              <select
                value={patientId}
                disabled={busy}
                onChange={(e) => {
                  setPatientId(e.target.value);
                  setEditing(false);
                  setSaved("");
                  setError("");
                }}
              >
                {patients.data.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.patientId}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <p>
              Create a <Link to="/patients">patient profile</Link> to start your
              care record.
            </p>
          )}
        </ResourceState>
      </section>
      {patientId && (
        <ResourceState resource={summary}>
          {data && (
            <>
              <section className="panel summary-header">
                <div className="section-heading">
                  <div>
                    <span className="sample-label">
                      Personal health summary
                    </span>
                    <h2>{data.patient.name}</h2>
                    <p>
                      {data.patient.patientId} · {data.patient.age} years ·{" "}
                      {data.patient.bloodGroup || "Blood group not recorded"}
                    </p>
                  </div>
                  <button
                    className="button secondary no-print"
                    onClick={() => window.print()}
                  >
                    Print / save PDF
                  </button>
                </div>
                <p>
                  Emergency contact:{" "}
                  {data.patient.emergencyContact || "Not recorded"} · Phone:{" "}
                  {data.patient.phone || "Not recorded"}
                </p>
                <p className="muted">
                  Generated {when(data.generatedAt)}. User-entered information,
                  not a verified clinical record.
                </p>
              </section>
              {error && <ErrorNotice message={error} />}{" "}
              {saved && <p role="status">{saved}</p>}
              <section className="panel">
                <div className="section-heading">
                  <h2>Allergies & care notes</h2>
                  <button
                    className="text-button no-print"
                    disabled={busy}
                    onClick={() => setEditing(!editing)}
                  >
                    {editing ? "Cancel editing" : "Edit care notes"}
                  </button>
                </div>
                {editing ? (
                  <form
                    className="form-grid no-print"
                    onSubmit={(e) => {
                      e.preventDefault();
                      mutate(
                        `/patients/${patientId}/care-profile`,
                        "PUT",
                        Object.fromEntries(new FormData(e.currentTarget)),
                        () => setEditing(false),
                      );
                    }}
                  >
                    <Field label="Allergies and reactions">
                      <textarea
                        name="allergies"
                        maxLength={2000}
                        rows={3}
                        defaultValue={data.profile.allergies}
                        placeholder="Include the substance and reaction, if known."
                      />
                    </Field>
                    <Field label="Conditions and health history">
                      <textarea
                        name="conditions"
                        maxLength={3000}
                        rows={3}
                        defaultValue={data.profile.conditions}
                      />
                    </Field>
                    <Field label="Care notes and questions">
                      <textarea
                        name="careNotes"
                        maxLength={3000}
                        rows={3}
                        defaultValue={data.profile.careNotes}
                        placeholder="Questions or details to discuss at your next visit."
                      />
                    </Field>
                    <button className="button" disabled={busy}>
                      Save care notes
                    </button>
                  </form>
                ) : (
                  <div className="explanation-grid">
                    {[
                      ["Allergies and reactions", data.profile.allergies],
                      ["Conditions and history", data.profile.conditions],
                      ["Notes for your next visit", data.profile.careNotes],
                    ].map(([label, value]) => (
                      <article key={label}>
                        <h3>{label}</h3>
                        <p className="preserve-lines">
                          {value || "Not recorded"}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
                <p className="muted">
                  An empty allergy field means “not recorded”, not “no
                  allergies”.{" "}
                  {data.profile.updatedBy &&
                    `Last updated by ${data.profile.updatedBy} on ${when(data.profile.updatedAt)}.`}
                </p>
              </section>
              <section className="panel">
                <h2>Medication list</h2>
                <p>
                  Record the instructions you were given. This list does not
                  create prescriptions, suggest doses, or send refill requests.
                </p>
                <div className="directory-list">
                  {data.medications.map((m) => (
                    <article className="directory-row" key={m.id}>
                      <div>
                        <h3>
                          {m.name} <small>· {m.status}</small>
                        </h3>
                        <p>
                          {m.dose} · {m.schedule}
                        </p>
                        {m.notes && <p className="preserve-lines">{m.notes}</p>}
                        <small>
                          {m.source} by {m.recordedBy} · Updated{" "}
                          {when(m.updatedAt)}
                        </small>
                      </div>
                      <button
                        className="text-button no-print"
                        disabled={busy}
                        onClick={() =>
                          mutate(`/medications/${m.id}/status`, "PUT", {
                            status:
                              m.status === "Active" ? "Stopped" : "Active",
                          })
                        }
                      >
                        {m.status === "Active"
                          ? "Mark as stopped"
                          : "Mark as active"}
                      </button>
                    </article>
                  ))}
                  {!data.medications.length && (
                    <p className="empty-state">No medications recorded.</p>
                  )}
                </div>
                <details className="no-print">
                  <summary>Add a medication to your list</summary>
                  <form
                    className="form-grid"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      mutate(
                        `/patients/${patientId}/medications`,
                        "POST",
                        Object.fromEntries(new FormData(form)),
                        () => form.reset(),
                      );
                    }}
                  >
                    <Field
                      label="Medication name"
                      name="name"
                      maxLength={120}
                      required
                    />
                    <Field
                      label="Dose as instructed"
                      name="dose"
                      maxLength={120}
                      required
                    />
                    <Field
                      label="Schedule as instructed"
                      name="schedule"
                      maxLength={200}
                      required
                    />
                    <Field label="Medication notes">
                      <textarea name="notes" maxLength={1000} rows={2} />
                    </Field>
                    <button className="button" disabled={busy}>
                      Save medication
                    </button>
                  </form>
                </details>
              </section>
              <section className="panel">
                <div className="section-heading">
                  <h2>Reading trends</h2>
                  <button
                    className="button secondary no-print"
                    disabled={!readings.length}
                    onClick={() =>
                      exportReadings(readings, data.patient.patientId)
                    }
                  >
                    Download readings CSV
                  </button>
                </div>
                <div className="form-grid no-print">
                  <Field label="Health parameter">
                    <select
                      value={metricKey}
                      onChange={(e) => setMetricKey(e.target.value)}
                    >
                      {metrics.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Reading source">
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    >
                      <option value="entered">Entered readings only</option>
                      <option value="all">Include simulations</option>
                    </select>
                  </Field>
                </div>
                <p>
                  Latest 100 readings available. Current view:{" "}
                  {source === "all" ? "entered and simulated" : "entered only"}.
                  Units: °C, bpm, mmHg, %, mg/dL, breaths/min.
                </p>
                {readings.length ? (
                  <HealthChart
                    data={[...readings]
                      .reverse()
                      .map((r) => ({
                        ...r,
                        time: new Date(r.createdAt).toLocaleString(),
                      }))}
                    metric={{
                      ...metric,
                      color: "#d2e5b0",
                      domain: ["auto", "auto"],
                    }}
                  />
                ) : (
                  <p className="empty-state">
                    No readings in this view.{" "}
                    <Link to={`/analysis?patient=${patientId}`}>
                      Add a reading
                    </Link>{" "}
                    or include simulations.
                  </p>
                )}
                <ReadingsTable records={readings} />
              </section>
              <section className="panel">
                <div className="section-heading">
                  <h2>Upcoming visits</h2>
                  <Link className="text-button no-print" to="/appointments">
                    Manage appointments
                  </Link>
                </div>
                {data.appointments
                  .filter(
                    (a) =>
                      ["Requested", "Confirmed"].includes(a.status) &&
                      new Date(a.scheduledAt) > new Date(),
                  )
                  .sort(
                    (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt),
                  )
                  .map((a) => (
                    <div className="directory-row" key={a.id}>
                      <div>
                        <h3>{a.doctorName}</h3>
                        <p>
                          {when(a.scheduledAt)} · {a.visitType} · {a.status}
                        </p>
                      </div>
                    </div>
                  ))}
                {!data.appointments.some(
                  (a) =>
                    ["Requested", "Confirmed"].includes(a.status) &&
                    new Date(a.scheduledAt) > new Date(),
                ) && <p className="empty-state">No upcoming visits.</p>}
              </section>
            </>
          )}
        </ResourceState>
      )}
      <Disclaimer />
    </div>
  );
}
