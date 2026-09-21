import { useState } from "react";
import { request } from "../services/api";
import { Field, ResourceState, useResource } from "../components/DataViews";
import { PageHeading, ErrorNotice, Loading } from "../components/UI";
export default function Doctors() {
  const doctors = useResource("/admin/doctors");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function create(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    try {
      await request(
        "/admin/doctors",
        "POST",
        Object.fromEntries(new FormData(form)),
      );
      form.reset();
      doctors.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-stack">
      <PageHeading
        title="Your clinical team."
        description="Create doctor accounts and manage their access to the academic workspace."
      />
      {error && <ErrorNotice message={error} />}
      <section className="panel">
        <h2>Add a doctor</h2>
        <form className="form-grid" onSubmit={create}>
          <Field label="Full name" name="name" required maxLength={100} />
          <Field
            label="Email address"
            name="email"
            type="email"
            required
            maxLength={150}
          />
          <Field
            label="Initial password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            required
          />
          <button className="button" disabled={busy}>
            {busy ? <Loading text="Creating account" /> : "Create doctor"}
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>Doctor accounts</h2>
        <ResourceState resource={doctors}>
          <div className="directory-list">
            {doctors.data?.map((d) => (
              <article className="directory-row" key={d.id}>
                <div>
                  <h3>{d.name}</h3>
                  <p>
                    {d.email} · {d.enabled ? "Active" : "Disabled"}
                  </p>
                </div>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      await request(`/admin/doctors/${d.id}/enabled`, "PUT", {
                        enabled: !d.enabled,
                      });
                      doctors.reload();
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {d.enabled ? "Disable access" : "Enable access"}
                </button>
              </article>
            ))}
            {doctors.data?.length === 0 && (
              <p className="empty-state">No doctors registered yet.</p>
            )}
          </div>
        </ResourceState>
      </section>
    </div>
  );
}
