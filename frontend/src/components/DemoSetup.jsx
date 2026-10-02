import { useState } from "react";
import { request } from "../services/api";
import { ErrorNotice } from "./UI";
export default function DemoSetup({ onCreated }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Prepare a classroom demo</h2>
          <p>
            Add three clearly labelled synthetic patients with saved readings
            and care notes.
          </p>
        </div>
        <button
          className="button secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const result = await request("/admin/demo", "POST");
              setMessage(result.message);
              onCreated();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Preparing…" : "Add demo patients"}
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      {error && <ErrorNotice message={error} />}
      <p className="muted">
        Existing demo names are skipped. This does not create shared login
        credentials or fabricated benchmark results.
      </p>
    </section>
  );
}
