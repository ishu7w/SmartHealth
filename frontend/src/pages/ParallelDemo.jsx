import { useEffect, useState } from "react";
import { request } from "../services/api";
import {
  Field,
  useResource,
  ResourceState,
  when,
} from "../components/DataViews";
import { PageHeading, ErrorNotice, Loading } from "../components/UI";
import PerformanceCharts from "../components/PerformanceCharts";
const ms = (n) => (n == null ? "—" : `${n.toFixed(3)} ms`);
export default function ParallelDemo() {
  const history = useResource("/process/benchmarks"),
    system = useResource("/process/system");
  const [count, setCount] = useState(1000),
    [threads, setThreads] = useState(4),
    [seed, setSeed] = useState(42),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    if (system.data) setThreads(Math.min(32, system.data.availableProcessors));
  }, [system.data?.availableProcessors]);
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(system.reload, 1000);
    return () => clearInterval(timer);
  }, [busy]);
  async function run(mode) {
    setBusy(mode);
    setError("");
    try {
      setResult(
        await request(`/process/${mode}`, "POST", {
          numberOfRecords: Number(count),
          threadCount: Number(threads),
          seed: Number(seed),
        }),
      );
      history.reload();
      system.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  const b = result?.summary,
    sys = system.data,
    timing = result?.parallel || result?.sequential;
  return (
    <div className="page-stack">
      <PageHeading
        title="Parallel processing performance."
        description="One dataset. Two execution strategies. Measure what concurrency changes on this server."
      />
      <section className="panel">
        <div className="section-heading">
          <h2>Configure an experiment</h2>
          <span className="sample-label">Java ExecutorService</span>
        </div>
        <div className="form-grid">
          <Field label="Patient records">
            <select
              value={count}
              disabled={!!busy}
              onChange={(e) => setCount(e.target.value)}
            >
              {[100, 500, 1000, 5000, 10000].map((n) => (
                <option key={n} value={n}>
                  {n.toLocaleString()} records
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Worker threads"
            type="number"
            min={1}
            max={32}
            step={1}
            value={threads}
            disabled={!!busy}
            onChange={(e) => setThreads(e.target.value)}
          />
          <Field
            label="Dataset seed"
            type="number"
            min={0}
            max={2147483647}
            step={1}
            value={seed}
            disabled={!!busy}
            onChange={(e) => setSeed(e.target.value)}
          />
        </div>
        <div className="form-actions">
          {["compare", "sequential", "parallel"].map((mode) => (
            <button
              className={`button ${mode === "compare" ? "" : "secondary"}`}
              key={mode}
              disabled={
                !!busy ||
                !Number.isInteger(Number(threads)) ||
                threads < 1 ||
                threads > 32 ||
                seed === "" ||
                !Number.isInteger(Number(seed)) ||
                seed < 0 ||
                seed > 2147483647
              }
              onClick={() => run(mode)}
            >
              {busy === mode ? (
                <Loading text="Processing records" />
              ) : mode === "compare" ? (
                "Compare both modes"
              ) : (
                `Run ${mode}`
              )}
            </button>
          ))}
        </div>
        <p className="muted">
          Both modes analyze the same seeded synthetic vitals and perform 12,000
          CPU mixing iterations per record. No sleep delays. Parallel timing
          includes creating the pool, submitting tasks, and collecting results.
          Small datasets can be slower in parallel.
        </p>
        {error && <ErrorNotice message={error} />}
      </section>
      <section className="panel">
        <h2>Server architecture</h2>
        <ResourceState resource={system}>
          {sys && (
            <>
              <div className="stats-grid">
                {[
                  ["Logical processors", sys.availableProcessors],
                  ["Active tasks", sys.activeTasks],
                  [
                    "JVM CPU load",
                    sys.processCpuLoad < 0
                      ? "Unavailable"
                      : `${(sys.processCpuLoad * 100).toFixed(1)}%`,
                  ],
                  [
                    "Used heap",
                    `${(sys.usedHeapBytes / 1048576).toFixed(1)} MB`,
                  ],
                ].map(([label, value]) => (
                  <div className="stat-cell" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <p>
                {sys.os} · {sys.architecture} · Java {sys.javaVersion}. CPU load
                is a recent JVM sample, not the CPU utilization of a single
                benchmark.
              </p>
            </>
          )}
        </ResourceState>
      </section>
      {b && (
        <section className="panel" aria-live="polite">
          <h2>Measured results</h2>
          <div className="stats-grid">
            {[
              ["Sequential", ms(b.sequentialTime)],
              ["Parallel", ms(b.parallelTime)],
              ["Time saved", ms(b.timeSaved)],
              ["Speedup", b.speedup == null ? "—" : `${b.speedup.toFixed(2)}×`],
              ["Worker threads", b.threadCount],
              ["Records per mode", b.numberOfRecords.toLocaleString()],
            ].map(([label, value]) => (
              <div className="stat-cell" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <p>
            {b.speedup != null
              ? b.speedup > 1
                ? "This run completed faster with parallel processing."
                : "This run was slower in parallel. Scheduling overhead, CPU limits, JIT compilation, and server load affect results."
              : "Run a comparison to calculate time saved and speedup."}
          </p>
          <p className="muted">
            Speedup = sequential time ÷ parallel time.{" "}
            {result.sequential && result.parallel
              ? "Full 64-bit result checksums matched on the server."
              : "Every task result was collected."}{" "}
            Dataset seed: {b.seed}. Process CPU time: {ms(b.processCpuMs)}.
          </p>
          <h3>Worker schedule · first {timing.tasks.length} records</h3>
          <p className="muted">
            Actual task start and finish offsets from the measured run. Bar
            length shows processing duration.
          </p>
          <div className="task-schedule">
            {timing.tasks.map((t) => (
              <div className="task-row" key={t.patientIndex}>
                <span>
                  Record {t.patientIndex + 1}
                  <small>{t.thread}</small>
                </span>
                <div className="task-track">
                  <i
                    style={{
                      marginLeft: `${(t.startMs / timing.totalMs) * 100}%`,
                      width: `${Math.max(0.2, ((t.endMs - t.startMs) / timing.totalMs) * 100)}%`,
                    }}
                  />
                </div>
                <small>
                  {t.startMs.toFixed(2)}–{t.endMs.toFixed(2)} ms
                </small>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="panel">
        <h2>Measured performance curves</h2>
        <ResourceState resource={history}>
          <PerformanceCharts runs={history.data || []} />
        </ResourceState>
      </section>
      <section className="panel">
        <h2>Benchmark history</h2>
        <p>
          Latest 100 runs. A comparison always measures sequential first after a
          50-record warm-up; repeat runs to observe variation.
        </p>
        <ResourceState resource={history}>
          <div className="table-scroll" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  {[
                    "Time",
                    "Mode",
                    "Records",
                    "Threads",
                    "Seed",
                    "Sequential",
                    "Parallel",
                    "Speedup",
                    "Time saved",
                  ].map((v) => (
                    <th key={v}>{v}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.data?.map((r) => (
                  <tr key={r.id}>
                    <td>{when(r.createdAt)}</td>
                    <td>{r.mode}</td>
                    <td>{r.numberOfRecords}</td>
                    <td>{r.threadCount}</td>
                    <td>{r.seed}</td>
                    <td>{ms(r.sequentialTime)}</td>
                    <td>{ms(r.parallelTime)}</td>
                    <td>{r.speedup?.toFixed(2) ?? "—"}</td>
                    <td>{ms(r.timeSaved)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.data?.length === 0 && (
              <p className="empty-state">
                No benchmarks yet. Run your first experiment above.
              </p>
            )}
          </div>
        </ResourceState>
      </section>
    </div>
  );
}
