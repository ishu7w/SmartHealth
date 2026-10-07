import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Field, ResourceState, useResource } from "../components/DataViews";
import { ErrorNotice, PageHeading } from "../components/UI";
import { request } from "../services/api";

export default function Tasks() {
  const patients = useResource("/patients");
  const [params, setParams] = useSearchParams();
  const selected =
    params.get("patient") || String(patients.data?.[0]?.id || "");
  const tasks = useResource(selected ? `/patients/${selected}/tasks` : null);
  const [form, setForm] = useState({
      title: "",
      instructions: "",
      dueDate: "",
    }),
    [filter, setFilter] = useState("Open"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    setForm({ title: "", instructions: "", dueDate: "" });
    setError("");
    setNotice("");
  }, [selected]);
  async function add(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(`/patients/${selected}/tasks`, "POST", form);
      setForm({ title: "", instructions: "", dueDate: "" });
      tasks.reload();
      setNotice("Follow-up task saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function update(t, status) {
    setBusy(true);
    setError("");
    try {
      await request(`/tasks/${t.id}`, "PUT", { status, version: t.version });
      tasks.reload();
      setNotice(`Task ${status.toLowerCase()}.`);
    } catch (e) {
      setError(e.message);
      tasks.reload();
    } finally {
      setBusy(false);
    }
  }
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const items =
    tasks.data?.filter((t) => filter === "All" || t.status === filter) || [];
  return (
    <div className="page-stack">
      <PageHeading
        title="Follow-up tasks."
        description="Keep personal reminders and care-team instructions together. Track what needs doing and what is complete."
      />
      {error && <ErrorNotice message={error} />}
      {notice && <p role="status">{notice}</p>}
      <ResourceState resource={patients}>
        {patients.data?.length ? (
          <>
            <section className="panel">
              <div className="form-grid">
                <Field label="Task patient">
                  <select
                    value={selected}
                    disabled={busy}
                    onChange={(e) => {
                      setParams({ patient: e.target.value });
                      setError("");
                      setNotice("");
                    }}
                  >
                    {patients.data.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Task status">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    {["Open", "Completed", "Cancelled", "All"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="muted">
                Due dates appear here when you sign in. Background, email, and
                SMS reminders are not enabled.
              </p>
            </section>
            <section className="panel">
              <h2>{filter === "All" ? "All tasks" : `${filter} tasks`}</h2>
              <ResourceState resource={tasks}>
                {!items.length && (
                  <p className="empty-state">
                    No {filter.toLowerCase()} tasks. Add a task below.
                  </p>
                )}
                {items.map((t) => (
                  <article key={t.id} className="follow-up-row">
                    <div>
                      <h3>{t.title}</h3>
                      <p className="preserve-lines">{t.instructions}</p>
                      <p className="muted">
                        Due{" "}
                        {new Date(`${t.dueDate}T12:00:00`).toLocaleDateString()}{" "}
                        · {t.source} · {t.createdBy}
                      </p>
                      {t.status === "Open" && t.dueDate < localToday && (
                        <span className="status warning">Overdue</span>
                      )}
                    </div>
                    <div className="task-actions">
                      {t.status === "Open" ? (
                        <>
                          <button
                            className="button"
                            disabled={busy}
                            onClick={() => update(t, "Completed")}
                          >
                            Mark complete
                          </button>
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() => update(t, "Cancelled")}
                          >
                            Cancel task
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="muted">{t.status}</span>
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() => update(t, "Open")}
                          >
                            Reopen task
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </ResourceState>
            </section>
            <section className="panel">
              <h2>Add a follow-up</h2>
              <form onSubmit={add}>
                <div className="form-grid">
                  <Field
                    label="Task title"
                    required
                    maxLength={160}
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                  <Field
                    label="Due date"
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                  />
                </div>
                <Field label="Instructions or notes">
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={form.instructions}
                    onChange={(e) =>
                      setForm({ ...form, instructions: e.target.value })
                    }
                  />
                </Field>
                <button
                  className="button"
                  disabled={busy || !form.title.trim()}
                >
                  {busy ? "Saving…" : "Save task"}
                </button>
              </form>
            </section>
          </>
        ) : (
          <section className="panel">
            <h2>Create your profile first.</h2>
            <p>Your tasks will be linked to your patient profile.</p>
            <Link className="button" to="/patients">
              Open profiles
            </Link>
          </section>
        )}
      </ResourceState>
    </div>
  );
}
