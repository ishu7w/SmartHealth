import { useEffect, useState, useRef } from "react";
import { flushSync } from "react-dom";
import { Flip, reduceMotion } from "../lib/motion";
import { Archive, ChevronRight, X } from "lucide-react";
import { api } from "../services/api";
import { ErrorNotice, Loading, StatusBadge, HealthScore } from "./UI";
import { metrics } from "../data/sampleData";
export default function History({ refresh = 0 }) {
  const container = useRef(null),
    flipAnimation = useRef(null);
  useEffect(() => () => flipAnimation.current?.kill(), []);
  const [records, setRecords] = useState(null),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(null),
    [detailError, setDetailError] = useState(""),
    [loadingId, setLoadingId] = useState(null);
  async function load() {
    setError("");
    try {
      setRecords(await api.history());
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [refresh]);
  async function show(id) {
    setLoadingId(id);
    setDetailError("");
    try {
      const record = await api.record(id);
      if (!container.current) return;
      flipAnimation.current?.kill();
      const state = Flip.getState(container.current);
      flushSync(() => setSelected(record));
      if (!reduceMotion())
        flipAnimation.current = Flip.from(state, {
          duration: 0.4,
          ease: "settle",
          scale: false,
        });
    } catch (e) {
      setDetailError(e.message);
    } finally {
      setLoadingId(null);
    }
  }
  return (
    <section ref={container} className="panel history">
      <div className="section-heading">
        <div>
          <h2>Recent analyses</h2>
          <p>Your latest saved patient records</p>
        </div>
        <span className="history-count">
          {records ? String(records.length).padStart(2, "0") : "—"} records
        </span>
      </div>
      {error ? (
        <ErrorNotice message={error} retry={load} />
      ) : !records ? (
        <Loading text="Loading saved analyses…" />
      ) : !records.length ? (
        <div className="empty-state">
          <Archive size={28} />
          <strong>No saved analyses yet</strong>
          <p>
            Analyze a patient and select Save Analysis to keep a record here.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {records.slice(0, 8).map((record) => (
            <button
              className="history-row"
              onClick={() => show(record.id)}
              key={record.id}
              disabled={loadingId !== null}
            >
              <span className="patient-avatar">
                {record.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="patient-name">
                <strong>{record.name}</strong>
                <small>{new Date(record.created_at).toLocaleString()}</small>
              </span>
              <span className="history-score">
                {record.health_score}
                <small>/100</small>
              </span>
              <StatusBadge status={record.risk_level} />
              {loadingId === record.id ? (
                <Loading text="" />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          ))}
        </div>
      )}
      {detailError && <ErrorNotice message={detailError} />}
      {selected && (
        <div className="record-detail" aria-live="polite">
          <div className="section-heading">
            <h3>
              {selected.name} · Saved analysis #{selected.id}
            </h3>
            <button
              className="icon-button"
              onClick={() => setSelected(null)}
              aria-label="Close record details"
            >
              <X size={18} />
            </button>
          </div>
          <p>
            {selected.age} years · {selected.gender} ·{" "}
            {new Date(selected.created_at).toLocaleString()}
          </p>
          <HealthScore
            score={selected.health_score}
            risk={selected.risk_level}
          />
          <dl className="record-vitals">
            {metrics.map((metric) => (
              <div key={metric.key}>
                <dt>{metric.label}</dt>
                <dd>
                  {selected.analysis.results[metric.key].value} {metric.unit}
                  <StatusBadge
                    status={selected.analysis.results[metric.key].status}
                  />
                </dd>
              </div>
            ))}
          </dl>
          <p>Symptoms: {selected.symptoms.join(", ") || "None reported"}</p>
        </div>
      )}
    </section>
  );
}
