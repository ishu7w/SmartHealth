import { useState } from "react";
import { useSession } from "../components/Session";
import { request } from "../services/api";
import {
  ResourceState,
  useResource,
  when,
  Field,
} from "../components/DataViews";
import {
  PageHeading,
  StatusBadge,
  ErrorNotice,
  Disclaimer,
} from "../components/UI";
export default function Alerts() {
  const alerts = useResource("/alerts"),
    { user } = useSession();
  const [filter, setFilter] = useState("All"),
    [busy, setBusy] = useState(null),
    [error, setError] = useState("");
  async function transition(id, action) {
    setBusy(id);
    setError("");
    try {
      await request(`/alerts/${id}/${action}`, "PUT");
      alerts.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="page-stack">
      <PageHeading
        title="Signals that matter."
        description="Review the latest 100 threshold alerts. Staff can acknowledge and resolve each signal."
        action={
          <button className="button secondary" onClick={alerts.reload}>
            Refresh alerts
          </button>
        }
      />
      {error && <ErrorNotice message={error} />}
      <section className="panel">
        <Field label="Filter alerts">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["All", "Critical", "New", "Acknowledged", "Resolved"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <ResourceState resource={alerts}>
          <div className="directory-list">
            {alerts.data
              ?.filter(
                (a) =>
                  filter === "All" ||
                  a.status === filter ||
                  a.riskLevel === filter,
              )
              .map((a) => (
                <article className="directory-row alert-row" key={a.id}>
                  <div>
                    <div className="row-actions">
                      <StatusBadge status={a.riskLevel} />
                      <span className="muted">{a.status}</span>
                    </div>
                    <h3>
                      {a.patientName} · {a.parameter}
                    </h3>
                    <p>
                      {a.message} · Recorded value: {a.measuredValue}
                    </p>
                    <small>
                      {when(a.createdAt)} · Patient #{a.patientId} · Alert #
                      {a.id}
                    </small>
                  </div>
                  {user.role !== "PATIENT" && a.status !== "Resolved" && (
                    <div className="row-actions">
                      {a.status === "New" && (
                        <button
                          className="button secondary"
                          disabled={busy === a.id}
                          onClick={() => transition(a.id, "acknowledge")}
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        className="button secondary"
                        disabled={busy === a.id}
                        onClick={() => transition(a.id, "resolve")}
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </article>
              ))}
            {!alerts.data?.some(
              (a) =>
                filter === "All" ||
                a.status === filter ||
                a.riskLevel === filter,
            ) && <p className="empty-state">No alerts match this view.</p>}
          </div>
        </ResourceState>
      </section>
      <Disclaimer />
    </div>
  );
}
