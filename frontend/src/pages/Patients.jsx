import { useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../services/api";
import { useSession } from "../components/Session";
import {
  Field,
  ReadingsTable,
  ResourceState,
  useResource,
} from "../components/DataViews";
import {
  PageHeading,
  ErrorNotice,
  Loading,
  StatusBadge,
} from "../components/UI";

const blank = {
  name: "",
  age: "",
  gender: "",
  bloodGroup: "Unknown",
  height: "",
  weight: "",
  phone: "",
  emergencyContact: "",
};
export default function Patients() {
  const { user } = useSession();
  const patients = useResource("/patients");
  const [search, setSearch] = useState(""),
    [risk, setRisk] = useState("All"),
    [editing, setEditing] = useState(null),
    [form, setForm] = useState(blank),
    [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const records = useResource(
    selected ? `/health-records/patient/${selected.id}` : null,
  );
  function edit(p) {
    setEditing(p?.id || "new");
    setForm(
      p
        ? {
            ...p,
            height: p.height ?? "",
            weight: p.weight ?? "",
            phone: p.phone ?? "",
            emergencyContact: p.emergencyContact ?? "",
          }
        : { ...blank, name: user.role === "PATIENT" ? user.name : "" },
    );
    setError("");
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(
        editing === "new" ? "/patients" : `/patients/${editing}`,
        editing === "new" ? "POST" : "PUT",
        {
          ...form,
          age: Number(form.age),
          height: form.height === "" ? null : Number(form.height),
          weight: form.weight === "" ? null : Number(form.weight),
        },
      );
      setEditing(null);
      patients.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-stack">
      <PageHeading
        title={
          user.role === "PATIENT"
            ? "Your patient profile."
            : "Patient directory."
        }
        description="Profiles, latest measurements, and a continuous health history."
        action={
          (user.role !== "PATIENT" || patients.data?.length === 0) && (
            <button className="button" onClick={() => edit(null)}>
              Add patient
            </button>
          )
        }
      />
      {error && <ErrorNotice message={error} />}
      {editing && (
        <section className="panel">
          <h2>{editing === "new" ? "New patient" : "Edit profile"}</h2>
          <form className="form-grid" onSubmit={save}>
            <Field
              label="Full name"
              value={form.name}
              maxLength={100}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Field
              label="Age"
              type="number"
              min={1}
              max={120}
              required
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
            <Field label="Gender">
              <select
                required
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Choose</option>
                {["Female", "Male", "Other", "Prefer not to say"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Blood group">
              <select
                value={form.bloodGroup || "Unknown"}
                onChange={(e) =>
                  setForm({ ...form, bloodGroup: e.target.value })
                }
              >
                {[
                  "Unknown",
                  "A+",
                  "A-",
                  "B+",
                  "B-",
                  "AB+",
                  "AB-",
                  "O+",
                  "O-",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            {[
              ["height", "Height (cm)", "number", 30, 250],
              ["weight", "Weight (kg)", "number", 1, 400],
              ["phone", "Phone", "tel"],
              ["emergencyContact", "Emergency contact", "text"],
            ].map(([key, label, type, min, max]) => (
              <Field
                key={key}
                label={label}
                type={type}
                min={min}
                max={max}
                step={type === "number" ? "0.1" : undefined}
                maxLength={key === "phone" ? 30 : 100}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            ))}
            <div className="form-actions">
              <button className="button" disabled={busy}>
                {busy ? <Loading text="Saving" /> : "Save profile"}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="panel">
        <Field
          label="Search patients"
          placeholder="Name or patient ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ResourceState resource={patients}>
          <Field label="Risk category">
            <select value={risk} onChange={(e) => setRisk(e.target.value)}>
              {[
                "All",
                "Normal",
                "Attention Required",
                "High Risk",
                "Critical",
                "No readings",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <div className="directory-list">
            {patients.data
              ?.filter(
                (p) =>
                  `${p.name} ${p.patientId}`
                    .toLowerCase()
                    .includes(search.toLowerCase()) &&
                  (risk === "All" ||
                    (p.latestReading?.healthStatus || "No readings") === risk),
              )
              .map((p) => (
                <article className="directory-row" key={p.id}>
                  <div>
                    <h3>{p.name}</h3>
                    <p>
                      {p.patientId} · {p.age} years · {p.gender} ·{" "}
                      {p.bloodGroup || "Unknown blood group"}
                    </p>
                    <StatusBadge
                      status={p.latestReading?.healthStatus || "No readings"}
                    />
                    <p>
                      {p.height ? `${p.height} cm` : "Height not set"} ·{" "}
                      {p.weight ? `${p.weight} kg` : "Weight not set"}
                    </p>
                    <small>
                      Phone: {p.phone || "Not set"} · Emergency contact:{" "}
                      {p.emergencyContact || "Not set"}
                    </small>
                    {p.latestReading && (
                      <p>
                        Latest: {p.latestReading.heartRate} bpm ·{" "}
                        {p.latestReading.systolicBP}/
                        {p.latestReading.diastolicBP} mmHg · SpO₂{" "}
                        {p.latestReading.spo2}% · {p.latestReading.temperature}{" "}
                        °C
                      </p>
                    )}
                  </div>
                  <div className="row-actions">
                    <Link className="text-button" to={`/care?patient=${p.id}`}>
                      Care record
                    </Link>
                    <button
                      className="text-button"
                      onClick={() => {
                        setSelected(p);
                        records.reload();
                      }}
                    >
                      History
                    </button>
                    <Link
                      className="text-button"
                      to={`/analysis?patient=${p.id}`}
                    >
                      Add reading
                    </Link>
                    <button className="text-button" onClick={() => edit(p)}>
                      Edit
                    </button>
                    {user.role === "ADMIN" && (
                      <button
                        className="text-button danger"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `Delete ${p.name} and all their readings and alerts?`,
                            )
                          )
                            return;
                          try {
                            await request(`/patients/${p.id}`, "DELETE");
                            if (selected?.id === p.id) setSelected(null);
                            patients.reload();
                          } catch (e) {
                            setError(e.message);
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </article>
              ))}
            {patients.data?.length === 0 && (
              <p className="empty-state">
                Create a profile to start recording health measurements.
              </p>
            )}
          </div>
        </ResourceState>
      </section>
      {selected && (
        <section className="panel">
          <div className="section-heading">
            <h2>{selected.name} · history</h2>
            <button className="text-button" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <p>Most recent 100 readings.</p>
          <ResourceState resource={records}>
            <ReadingsTable records={records.data || []} />
          </ResourceState>
        </section>
      )}
    </div>
  );
}
