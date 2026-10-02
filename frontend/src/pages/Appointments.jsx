import { useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../services/api";
import { useSession } from "../components/Session";
import {
  Field,
  useResource,
  ResourceState,
  when,
} from "../components/DataViews";
import { PageHeading, ErrorNotice, StatusBadge } from "../components/UI";
import { calendarFile } from "../lib/download";

export default function Appointments() {
  const { user } = useSession(),
    patients = useResource("/patients"),
    doctors = useResource("/care/doctors"),
    appointments = useResource("/appointments");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [view, setView] = useState("Upcoming"),
    [notes, setNotes] = useState({});
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  async function create(e) {
    e.preventDefault();
    const form = e.currentTarget,
      data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request("/appointments", "POST", {
        ...data,
        patientId: Number(data.patientId),
        doctorId: Number(data.doctorId),
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      });
      form.reset();
      appointments.reload();
      setNotice(
        "Request sent. Your appointment is not booked until staff confirms it.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function update(a, status) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request(`/appointments/${a.id}`, "PUT", {
        status,
        staffNotes: notes[a.id] ?? a.staffNotes,
        version: a.version,
      });
      appointments.reload();
      setNotice(`Appointment ${status.toLowerCase()}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const visible = (appointments.data || [])
    .filter((a) =>
      view === "All" || view === "Upcoming"
        ? view === "All" ||
          (["Requested", "Confirmed"].includes(a.status) &&
            new Date(a.scheduledAt) > new Date())
        : a.status === view,
    )
    .sort((a, b) =>
      view === "Upcoming"
        ? new Date(a.scheduledAt) - new Date(b.scheduledAt)
        : new Date(b.scheduledAt) - new Date(a.scheduledAt),
    );
  return (
    <div className="page-stack">
      <PageHeading
        title="Make time for care."
        description="Request a visit, follow its status, and keep confirmed appointments in your calendar."
      />
      <section className="panel">
        <h2>Request an appointment</h2>
        <p>
          Requests are reviewed by staff. This academic portal is not connected
          to a real clinic. Visits are 30 minutes; staff adds location or call
          details when confirming. All times are shown in {zone}.
        </p>
        <ResourceState resource={patients}>
          <ResourceState resource={doctors}>
            {patients.data?.length && doctors.data?.length ? (
              <form className="form-grid" onSubmit={create}>
                <Field label="Patient">
                  <select name="patientId" required>
                    {patients.data.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.patientId}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Doctor">
                  <select name="doctorId" required>
                    {doctors.data.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={`Preferred date and time (${zone})`}
                  type="datetime-local"
                  name="scheduledAt"
                  required
                />
                <Field label="Visit type">
                  <select name="visitType">
                    <option>In person</option>
                    <option>Phone</option>
                    <option>Video</option>
                  </select>
                </Field>
                <Field label="Reason for visit">
                  <textarea name="reason" maxLength={1000} rows={3} required />
                </Field>
                <button className="button" disabled={busy}>
                  Request appointment
                </button>
              </form>
            ) : (
              <p className="empty-state">
                {!patients.data?.length ? (
                  <>
                    <Link to="/patients">Create a patient profile</Link> before
                    requesting a visit.
                  </>
                ) : (
                  "No doctors are available yet. An administrator must add an active doctor account."
                )}
              </p>
            )}
          </ResourceState>
        </ResourceState>
      </section>
      {error && <ErrorNotice message={error} />}{" "}
      {notice && <p role="status">{notice}</p>}
      <section className="panel">
        <div className="section-heading">
          <h2>Your appointment timeline</h2>
          <button className="text-button" onClick={appointments.reload}>
            Refresh appointments
          </button>
        </div>
        <Field label="Appointment view">
          <select value={view} onChange={(e) => setView(e.target.value)}>
            {[
              "Upcoming",
              "Requested",
              "Confirmed",
              "Completed",
              "Cancelled",
              "All",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <ResourceState resource={appointments}>
          <div className="directory-list">
            {visible.map((a) => {
              const active = ["Requested", "Confirmed"].includes(a.status),
                canManage =
                  user.role === "ADMIN" ||
                  (user.role === "DOCTOR" && user.id === a.doctorId);
              return (
                <article className="appointment-card" key={a.id}>
                  <div className="section-heading">
                    <div>
                      <h3>
                        {a.patientName} · {a.doctorName}
                      </h3>
                      <p>
                        {when(a.scheduledAt)} · {a.visitType} · 30 minutes
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="preserve-lines">{a.reason}</p>
                  {a.staffNotes && (
                    <p className="preserve-lines">
                      <strong>Staff notes: </strong>
                      {a.staffNotes}
                    </p>
                  )}
                  {canManage && active && (
                    <Field label={`Staff notes for appointment ${a.id}`}>
                      <textarea
                        maxLength={2000}
                        rows={2}
                        value={notes[a.id] ?? a.staffNotes}
                        onChange={(e) =>
                          setNotes({ ...notes, [a.id]: e.target.value })
                        }
                        placeholder="Add visit location or calling instructions. Saved with a status change."
                      />
                    </Field>
                  )}
                  <div className="row-actions">
                    {canManage && a.status === "Requested" && (
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => update(a, "Confirmed")}
                      >
                        Confirm request
                      </button>
                    )}
                    {canManage &&
                      a.status === "Confirmed" &&
                      new Date(a.scheduledAt) <= new Date() && (
                        <button
                          className="button secondary"
                          disabled={busy}
                          onClick={() => update(a, "Completed")}
                        >
                          Mark completed
                        </button>
                      )}
                    {active && (canManage || user.role === "PATIENT") && (
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm("Cancel this appointment?"))
                            update(a, "Cancelled");
                        }}
                      >
                        Cancel appointment
                      </button>
                    )}
                    {a.status === "Confirmed" && (
                      <button
                        className="text-button"
                        onClick={() => calendarFile(a)}
                      >
                        Add to calendar
                      </button>
                    )}
                  </div>
                  <small className="muted">
                    Appointment #{a.id} · Updated {when(a.updatedAt)}
                  </small>
                </article>
              );
            })}
            {!visible.length && (
              <p className="empty-state">No appointments match this view.</p>
            )}
          </div>
        </ResourceState>
        <p className="muted">
          Latest 100 appointments. Requested times are preferences, not
          available slots. Only confirmed appointments can be exported. Calendar
          files do not update automatically after cancellation.
        </p>
      </section>
    </div>
  );
}
