import { Link } from "react-router-dom";
import { useSession } from "./Session";
import { ResourceState, useResource, when } from "./DataViews";
import { unread } from "../pages/Messages";
export default function CareOverview() {
  const { user } = useSession();
  const visits = useResource("/appointments"),
    inbox = useResource("/conversations"),
    patients = useResource(user.role === "PATIENT" ? "/patients" : null);
  const patient = patients.data?.[0];
  const tasks = useResource(patient ? `/patients/${patient.id}/tasks` : null);
  const upcoming =
    visits.data
      ?.filter(
        (v) =>
          ["Requested", "Confirmed"].includes(v.status) &&
          new Date(v.scheduledAt) >= new Date(),
      )
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
      .slice(0, 3) || [];
  const newMessages = inbox.data?.filter((c) => unread(c, user)).length || 0;
  return (
    <section className="panel care-overview">
      <div className="section-heading">
        <h2>
          {user.role === "PATIENT" ? "Your next steps" : "Care-team workspace"}
        </h2>
        <button
          className="text-button"
          onClick={() => {
            visits.reload();
            inbox.reload();
            tasks.reload();
          }}
        >
          Refresh care
        </button>
      </div>
      <div className="care-overview-grid">
        <div>
          <h3>Upcoming appointments</h3>
          <ResourceState resource={visits}>
            {upcoming.length ? (
              upcoming.map((v) => (
                <p key={v.id}>
                  <strong>
                    {user.role === "PATIENT" ? v.doctorName : v.patientName}
                  </strong>
                  <br />
                  {when(v.scheduledAt)} · {v.status}
                </p>
              ))
            ) : (
              <p>No upcoming appointments.</p>
            )}
          </ResourceState>
          <Link to="/appointments" className="text-button">
            Manage appointments
          </Link>
        </div>
        <div>
          <h3>Messages</h3>
          <ResourceState resource={inbox}>
            <p>
              {user.role === "ADMIN"
                ? `${inbox.data?.length || 0} care-team conversations`
                : `${newMessages} unread conversation${newMessages === 1 ? "" : "s"}`}
            </p>
          </ResourceState>
          <Link to="/messages" className="text-button">
            Open inbox
          </Link>
        </div>
        <div>
          <h3>Follow-up</h3>
          {user.role === "PATIENT" ? (
            <ResourceState resource={tasks}>
              {tasks.data?.some((t) => t.status === "Open") ? (
                tasks.data
                  .filter((t) => t.status === "Open")
                  .slice(0, 3)
                  .map((t) => (
                    <p key={t.id}>
                      <strong>{t.title}</strong>
                      <br />
                      Due {t.dueDate}
                    </p>
                  ))
              ) : (
                <p>No open tasks.</p>
              )}
            </ResourceState>
          ) : (
            <p>Review patient tasks and record the next step in their care.</p>
          )}
          <Link to="/tasks" className="text-button">
            View follow-up tasks
          </Link>
        </div>
      </div>
    </section>
  );
}
