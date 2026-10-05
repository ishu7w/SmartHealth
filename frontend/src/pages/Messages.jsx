import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "../components/Session";
import {
  Field,
  ResourceState,
  useResource,
  when,
} from "../components/DataViews";
import { ErrorNotice, PageHeading } from "../components/UI";
import { request } from "../services/api";

export function unread(conversation, user) {
  const seen =
    user.role === "PATIENT"
      ? conversation.patientReadAt
      : conversation.doctorReadAt;
  return (
    user.role !== "ADMIN" &&
    (!seen || new Date(conversation.updatedAt) > new Date(seen))
  );
}
export default function Messages() {
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const selected = params.get("thread");
  const list = useResource("/conversations"),
    patients = useResource("/patients"),
    doctors = useResource("/care/doctors");
  const [page, setPage] = useState(0),
    [body, setBody] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const thread = useResource(
    selected ? `/conversations/${selected}?page=${page}` : null,
  );
  const [draft, setDraft] = useState({
    patientId: "",
    doctorId: "",
    subject: "",
    body: "",
  });
  useEffect(() => {
    setPage(0);
    setBody("");
    setError("");
  }, [selected]);
  useEffect(() => {
    const last = thread.data?.messages?.at(-1);
    if (page !== 0 || !last || String(thread.data.conversation.id) !== selected)
      return;
    let active = true;
    request(`/conversations/${selected}/read`, "POST", { messageId: last.id })
      .then(() => {
        if (active) list.reload();
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [thread.data, selected, page]);
  const linked = patients.data?.filter((p) => p.userId != null) || [];
  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const c = await request("/conversations", "POST", {
        ...draft,
        patientId: Number(draft.patientId || linked[0]?.id),
        doctorId: Number(user.role === "DOCTOR" ? user.id : draft.doctorId),
      });
      setDraft({ patientId: "", doctorId: "", subject: "", body: "" });
      list.reload();
      setPage(0);
      setParams({ thread: String(c.id) });
      setNotice("Message sent to your care-team inbox.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function reply(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(`/conversations/${selected}/messages`, "POST", { body });
      setBody("");
      setPage(0);
      thread.reload();
      list.reload();
      setNotice("Reply sent.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-stack">
      <PageHeading
        title="Your messages."
        description="Private conversations with the doctor you choose. Messages stay in your signed-in portal."
      />
      <p className="portal-notice">
        For routine questions and follow-up. Responses depend on your care team;
        this inbox is not monitored for emergencies. Refresh to check for
        replies.
      </p>
      {error && <ErrorNotice message={error} />}
      {notice && <p role="status">{notice}</p>}
      <div className="inbox-layout">
        <section className="panel inbox-list">
          <div className="section-heading">
            <h2>Inbox</h2>
            <button
              className="text-button"
              onClick={() => {
                list.reload();
                thread.reload();
              }}
            >
              Refresh
            </button>
          </div>
          <ResourceState resource={list}>
            {!list.data?.length && (
              <p className="empty-state">
                No conversations yet. Start one below.
              </p>
            )}
            {list.data?.map((c) => (
              <button
                key={c.id}
                className={`conversation-row ${String(c.id) === selected ? "selected" : ""}`}
                onClick={() => {
                  setPage(0);
                  setParams({ thread: String(c.id) });
                }}
              >
                <strong>
                  {c.subject}
                  {unread(c, user) && (
                    <span className="unread-dot" aria-label="Unread messages" />
                  )}
                </strong>
                <span>
                  {user.role === "PATIENT" ? c.doctorName : c.patientName}
                </span>
                <small>{when(c.updatedAt)}</small>
              </button>
            ))}
          </ResourceState>
        </section>
        <section className="panel message-thread" aria-label="Conversation">
          {!selected ? (
            <div className="empty-state">
              <h2>A direct line to your care team.</h2>
              <p>Choose a conversation or send a new message.</p>
            </div>
          ) : (
            <ResourceState resource={thread}>
              {thread.data && (
                <>
                  <h2>{thread.data.conversation.subject}</h2>
                  <p className="muted">
                    {thread.data.conversation.patientName} ·{" "}
                    {thread.data.conversation.doctorName}
                    {user.role === "ADMIN" ? " · Administrator access" : ""}
                  </p>
                  <div className="thread-pagination">
                    <button
                      className="text-button"
                      disabled={!thread.data.hasOlder}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Older messages
                    </button>
                    <span>Page {page + 1}</span>
                    <button
                      className="text-button"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Newer messages
                    </button>
                  </div>
                  <div className="message-list">
                    {thread.data.messages.map((m) => (
                      <article
                        className={`message-bubble ${m.senderId === user.id ? "own" : ""}`}
                        key={m.id}
                      >
                        <div>
                          <strong>{m.senderName}</strong>
                          <span>
                            {m.senderRole.toLowerCase()} · {when(m.createdAt)}
                          </span>
                        </div>
                        <p>{m.body}</p>
                      </article>
                    ))}
                  </div>
                  <form onSubmit={reply}>
                    <Field label="Your reply">
                      <textarea
                        required
                        maxLength={4000}
                        rows={4}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                      />
                    </Field>
                    <button className="button" disabled={busy || !body.trim()}>
                      {busy ? "Sending…" : "Send reply"}
                    </button>
                  </form>
                </>
              )}
            </ResourceState>
          )}
        </section>
      </div>
      <section className="panel">
        <h2>New conversation</h2>
        <ResourceState resource={patients}>
          <ResourceState resource={doctors}>
            {!linked.length ? (
              <p className="empty-state">
                A patient portal profile is needed to send messages.
                Staff-created profiles need an associated patient account.
              </p>
            ) : !doctors.data?.length ? (
              <p className="empty-state">
                No doctors are available. Your administrator needs to add a
                care-team account.
              </p>
            ) : (
              <form onSubmit={create}>
                <div className="form-grid">
                  <Field label="Patient">
                    <select
                      value={draft.patientId || linked[0]?.id}
                      onChange={(e) =>
                        setDraft({ ...draft, patientId: e.target.value })
                      }
                    >
                      {linked.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {user.role !== "DOCTOR" && (
                    <Field label="Message doctor">
                      <select
                        required
                        value={draft.doctorId}
                        onChange={(e) =>
                          setDraft({ ...draft, doctorId: e.target.value })
                        }
                      >
                        <option value="">Choose your doctor</option>
                        {doctors.data.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field
                    label="Subject"
                    required
                    maxLength={160}
                    value={draft.subject}
                    onChange={(e) =>
                      setDraft({ ...draft, subject: e.target.value })
                    }
                  />
                </div>
                <Field label="Message">
                  <textarea
                    required
                    maxLength={4000}
                    rows={4}
                    value={draft.body}
                    onChange={(e) =>
                      setDraft({ ...draft, body: e.target.value })
                    }
                  />
                </Field>
                <button
                  className="button"
                  disabled={busy || !draft.body.trim() || !draft.subject.trim()}
                >
                  {busy ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </ResourceState>
        </ResourceState>
      </section>
    </div>
  );
}
