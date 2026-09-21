import { createContext, useContext, useEffect, useState } from "react";
import { Link, Navigate, Outlet } from "react-router-dom";
import { request, logout } from "../services/api";
import { ErrorNotice, Loading } from "./UI";

const Session = createContext(null);
export const useSession = () => useContext(Session);
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setUser(await request("/auth/me"));
    } catch (e) {
      setUser(null);
      if (e.status !== 401) setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);
  return (
    <Session.Provider value={{ user, setUser, loading, error, refresh }}>
      {children}
    </Session.Provider>
  );
}
export function RequireAccount({ staff = false, admin = false }) {
  const { user, loading, error, refresh } = useSession();
  if (loading)
    return (
      <section className="panel">
        <h1>Opening your workspace.</h1>
        <Loading />
      </section>
    );
  if (error)
    return (
      <section className="panel">
        <h1>Connection unavailable.</h1>
        <ErrorNotice message={error} retry={refresh} />
      </section>
    );
  if (!user) return <Navigate to="/account" replace />;
  if ((staff && user.role === "PATIENT") || (admin && user.role !== "ADMIN"))
    return (
      <section className="panel">
        <h1>Staff workspace.</h1>
        <p>Your account does not have access to this area.</p>
        <Link to="/">Return to overview</Link>
      </section>
    );
  return <Outlet />;
}
export function AccountBar() {
  const { user, setUser } = useSession();
  const [error, setError] = useState("");
  if (!user) return null;
  return (
    <div className="account-section">
      <div className="account-bar">
        <span>
          <strong>{user.name}</strong>{" "}
          <span className="muted">{user.role.toLowerCase()}</span>
        </span>
        <nav aria-label="Workspace navigation">
          <Link to="/patients">
            {user.role === "PATIENT" ? "My profile" : "Patients"}
          </Link>
          <Link to="/alerts">Alerts</Link>
          {user.role === "ADMIN" && <Link to="/doctors">Doctors</Link>}
          <button
            className="text-button"
            onClick={async () => {
              try {
                await logout();
                setUser(null);
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            Sign out
          </button>
        </nav>
      </div>
      {error && <ErrorNotice message={error} />}
    </div>
  );
}
