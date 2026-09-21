import { useState } from "react";
import { Navigate } from "react-router-dom";
import { login, request } from "../services/api";
import { useSession } from "../components/Session";
import { Field } from "../components/DataViews";
import {
  PageHeading,
  ErrorNotice,
  Loading,
  Disclaimer,
} from "../components/UI";

export default function Account() {
  const { user, setUser } = useSession();
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (user) return <Navigate to="/" replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (register) await request("/auth/register", "POST", data);
      setUser(await login(data.email, data.password));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-stack">
      <PageHeading
        title="Your health workspace."
        description="Patient records, clear signals, and the computing behind them."
      />
      <section className="panel account-panel">
        <div className="section-heading">
          <h2>{register ? "Create a patient account" : "Welcome back"}</h2>
          <span className="sample-label">Academic edition</span>
        </div>
        <p>
          {register
            ? "Your account gives you access to your own profile and readings."
            : "Sign in with your patient, doctor, or administrator account."}
        </p>
        <form onSubmit={submit} className="form-grid">
          {register && (
            <Field
              label="Full name"
              name="name"
              autoComplete="name"
              maxLength={100}
              required
            />
          )}
          <Field
            label="Email address"
            type="email"
            name="email"
            autoComplete="username"
            maxLength={150}
            required
          />
          <Field
            label="Password"
            type="password"
            name="password"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={register ? 12 : undefined}
            maxLength={72}
            required
          />
          {register && (
            <p className="muted">
              Use 12–72 characters. Staff accounts are provided by an
              administrator.
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy ? (
              <Loading text="Opening workspace" />
            ) : register ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </button>
        </form>
        {error && <ErrorNotice message={error} />}
        <button
          className="text-button"
          disabled={busy}
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register
            ? "Already registered? Sign in"
            : "New patient? Create an account"}
        </button>
      </section>
      <Disclaimer />
    </div>
  );
}
