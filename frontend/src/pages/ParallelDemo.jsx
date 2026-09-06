import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Cpu,
  Play,
  ArrowRight,
  GitBranch,
  Layers,
  Timer,
  Zap,
  RotateCcw,
  Info,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import gsap from "gsap";
import { reduceMotion } from "../lib/motion";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { api } from "../services/api";
import { metrics, samplePatient } from "../data/sampleData";
import {
  PageHeading,
  ErrorNotice,
  Loading,
  StatusBadge,
} from "../components/UI";
gsap.registerPlugin(DrawSVGPlugin);
const concepts = [
  [
    "Sequential Execution",
    "Tasks are completed one after another. Each task waits for the previous task to finish.",
    Layers,
  ],
  [
    "Parallel Execution",
    "Independent tasks execute concurrently using five worker threads.",
    GitBranch,
  ],
  [
    "Thread-Level Parallelism",
    "Work is assigned to separate threads. This example demonstrates overlapping waiting work.",
    Cpu,
  ],
  [
    "Speedup",
    "Divide sequential time by parallel time to compare how long the same work takes.",
    Zap,
  ],
];
function TimingLane({ run, mode, maxTime }) {
  const lane = useRef(null);
  useLayoutEffect(() => {
    if (!run || reduceMotion()) return;
    const context = gsap.context(
      () =>
        gsap.fromTo(
          ".task-bar",
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 0.55,
            stagger: 0.045,
            ease: "settle",
            clearProps: "transform,transformOrigin",
          },
        ),
      lane,
    );
    return () => context.revert();
  }, [run]);
  return (
    <section ref={lane} className="panel timing-panel">
      <div className="section-heading">
        <div>
          <h2>
            {mode === "sequential"
              ? "Sequential processing"
              : "Parallel processing"}
          </h2>
          <p>
            {mode === "sequential"
              ? "One task at a time · 1 worker"
              : "Independent tasks together · 5 workers"}
          </p>
        </div>
        <span className="timing-total">
          {run ? `${run.total_ms.toFixed(1)} ms` : "Not run"}
        </span>
      </div>
      <div className="flow-label">
        <span>Patient input</span>
        <ArrowRight size={15} />
        <span>
          {mode === "sequential" ? "Ordered tasks" : "Fan out to workers"}
        </span>
      </div>
      <div className="task-lanes">
        {metrics.map((metric, i) => {
          const task = run?.tasks.find((item) => item.parameter === metric.key);
          return (
            <div key={metric.key} className="task-row">
              <div>
                <span>{metric.label}</span>
                <small>
                  {task
                    ? `${task.duration_ms.toFixed(1)} ms`
                    : "Waiting for a run"}
                </small>
              </div>
              <div className="task-track">
                {task ? (
                  <div
                    className={`task-bar ${mode}`}
                    style={{
                      left: `${(task.start_ms / maxTime) * 100}%`,
                      width: `${(task.duration_ms / maxTime) * 100}%`,
                    }}
                    title={`Start ${task.start_ms.toFixed(2)} ms; end ${task.end_ms.toFixed(2)} ms`}
                  />
                ) : (
                  <div
                    className="task-placeholder"
                    style={{
                      width: mode === "sequential" ? "17%" : "70%",
                      marginLeft: mode === "sequential" ? `${i * 19}%` : 0,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="timeline-axis">
        <span>0 ms</span>
        <span>
          {run
            ? `${maxTime.toFixed(0)} ms`
            : "Illustrative layout until measured"}
        </span>
      </div>
      <div className="combined-result">
        {run ? <Check size={15} /> : <Layers size={15} />}Combined result
        {run && <StatusBadge status={run.risk_level} />}
      </div>
    </section>
  );
}
function WorkerReplay({ run }) {
  const [elapsed, setElapsed] = useState(Infinity),
    [replaying, setReplaying] = useState(false);
  const animation = useRef(null),
    wires = useRef(null);
  useEffect(() => {
    animation.current?.kill();
    setElapsed(Infinity);
    setReplaying(false);
    return () => animation.current?.kill();
  }, [run]);
  function replay() {
    if (!run) return;
    animation.current?.kill();
    if (reduceMotion()) {
      setElapsed(Infinity);
      setReplaying(false);
      return;
    }
    const clock = { time: 0 };
    setElapsed(0);
    setReplaying(true);
    animation.current = gsap
      .timeline({ onComplete: () => setReplaying(false) })
      .fromTo(
        wires.current.querySelectorAll("path"),
        { drawSVG: 0 },
        { drawSVG: "100%", duration: 0.3, ease: "power2.out" },
      )
      .to(clock, {
        time: run.total_ms,
        duration: (run.total_ms / 1000) * 4,
        ease: "none",
        onUpdate: () => setElapsed(clock.time),
      });
  }
  return (
    <section className="panel core-panel">
      <div className="section-heading">
        <div>
          <h2>Processing Core Visualization</h2>
          <p>Conceptual worker lanes, not physical CPU core measurements.</p>
        </div>
        <button
          className="button secondary small-button"
          onClick={replay}
          disabled={!run}
        >
          <RotateCcw size={15} />
          {replaying ? "Restart replay" : "Replay measured run"}
        </button>
      </div>
      <div className="worker-source">
        <span>
          <Layers size={16} />
          Patient input
        </span>
        <small>
          {run
            ? `${run.mode === "parallel" ? "Parallel" : "Sequential"} schedule · replay at ¼ speed`
            : "Run an analysis to see task distribution"}
        </small>
      </div>
      <svg
        ref={wires}
        className="worker-wires"
        viewBox="0 0 1000 45"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {[100, 300, 500, 700, 900].map((x) => (
          <path
            key={x}
            d={`M500 0V15H${x}V45`}
            fill="none"
            stroke="#999999"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <div className="worker-grid">
        {metrics.map((metric, i) => {
          const task = run?.tasks.find((item) => item.parameter === metric.key);
          const status =
            !task || elapsed < task.start_ms
              ? "Waiting"
              : elapsed < task.end_ms
                ? "Running"
                : "Completed";
          return (
            <div className={`worker ${status.toLowerCase()}`} key={metric.key}>
              <div>
                <Cpu size={19} />
                <span>Worker {run?.mode === "sequential" ? 1 : i + 1}</span>
              </div>
              <strong>{metric.label}</strong>
              <StatusBadge status={status} />
              <div className="worker-progress">
                <span
                  style={{
                    width:
                      status === "Completed"
                        ? "100%"
                        : status === "Running"
                          ? `${Math.max(0, Math.min(100, ((elapsed - task.start_ms) / task.duration_ms) * 100))}%`
                          : 0,
                  }}
                />
              </div>
              <small>
                {task
                  ? `${task.duration_ms.toFixed(1)} ms`
                  : "No measurement yet"}
              </small>
            </div>
          );
        })}
      </div>
      <p className="small muted replay-note">
        {run?.mode === "sequential"
          ? "Worker 1 handles all five tasks in order."
          : "Each independent parameter is assigned to a separate worker thread."}{" "}
        States during replay follow recorded backend timestamps. Reduced-motion
        mode shows completed results directly.
      </p>
    </section>
  );
}
export default function ParallelDemo() {
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [sequential, setSequential] = useState(null),
    [parallel, setParallel] = useState(null),
    [comparison, setComparison] = useState(null),
    [latest, setLatest] = useState(null),
    [lastMode, setLastMode] = useState("compare");
  async function run(mode) {
    setBusy(mode);
    setLastMode(mode);
    setError("");
    setComparison(null);
    try {
      const result = await api.run(mode, samplePatient);
      if (mode === "compare") {
        setSequential(result.sequential);
        setParallel(result.parallel);
        setComparison(result);
        setLatest(result.parallel);
      } else {
        if (mode === "sequential") setSequential(result);
        else setParallel(result);
        setLatest(result);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  const maxTime = Math.max(
    sequential?.total_ms || 0,
    parallel?.total_ms || 0,
    1,
  );
  return (
    <div className="page-stack parallel-page">
      <PageHeading
        title="Same work. A different rhythm."
        description="Parallel Health Data Processing. Put sequential and concurrent execution side by side."
        action={
          <span className="subtle-tag">
            <Cpu size={15} />
            ThreadPoolExecutor
          </span>
        }
      />
      <div className="workload-notice">
        <Info size={21} />
        <div>
          <strong>Simulated Processing Workload</strong>
          <p>
            Each demo task includes 160–240 ms of controlled waiting. Both modes
            use the same patient and delays. The patient analysis page has no
            artificial delay.
          </p>
        </div>
      </div>
      <div className="processing-workspace">
        <section className="panel demo-controls">
          <div className="section-heading">
            <div>
              <h2>Same patient. Two execution paths.</h2>
              <p>
                Five independent rule checks, measured with Python’s
                perf_counter.
              </p>
            </div>
            <span className="sample-label">Sample patient data</span>
          </div>
          <div className="demo-inputs">
            {metrics.map((metric) => (
              <div key={metric.key}>
                <span>{metric.label}</span>
                <strong>
                  {metric.key === "blood_pressure"
                    ? "118 / 78"
                    : samplePatient[metric.key]}{" "}
                  <small>{metric.unit}</small>
                </strong>
              </div>
            ))}
          </div>
          <div className="button-row">
            <button
              className="button secondary"
              onClick={() => run("sequential")}
              disabled={!!busy}
            >
              {busy === "sequential" ? (
                <Loading text="Running sequential…" />
              ) : (
                <>
                  <Play size={15} />
                  Run Sequential Analysis
                </>
              )}
            </button>
            <button
              className="button secondary"
              onClick={() => run("parallel")}
              disabled={!!busy}
            >
              {busy === "parallel" ? (
                <Loading text="Running parallel…" />
              ) : (
                <>
                  <GitBranch size={16} />
                  Run Parallel Analysis
                </>
              )}
            </button>
            <button
              className="button"
              onClick={() => run("compare")}
              disabled={!!busy}
            >
              {busy === "compare" ? (
                <Loading text="Measuring both modes…" />
              ) : (
                <>
                  <Zap size={16} />
                  Run Comparison
                </>
              )}
            </button>
          </div>
          {busy && (
            <p className="small muted" role="status">
              Waiting for measured backend results
              {busy === "compare" ? ": sequential first, then parallel" : ""}…
            </p>
          )}
          {error && <ErrorNotice message={error} retry={() => run(lastMode)} />}
        </section>
        <div className="execution-pair">
          <TimingLane run={sequential} mode="sequential" maxTime={maxTime} />
          <TimingLane run={parallel} mode="parallel" maxTime={maxTime} />
        </div>
      </div>
      <section className="comparison-section" aria-live="polite">
        <div className="section-heading">
          <div>
            <h2>Performance comparison</h2>
            <p>
              {comparison
                ? "Actual backend measurements from the same comparison run."
                : "Run Comparison to measure both modes and calculate speedup."}
            </p>
          </div>
          <Timer size={20} className="muted" />
        </div>
        <div className="comparison-stats">
          {[
            [
              "Sequential time",
              comparison && `${comparison.sequential.total_ms.toFixed(1)}`,
              "ms",
            ],
            [
              "Parallel time",
              comparison && `${comparison.parallel.total_ms.toFixed(1)}`,
              "ms",
            ],
            ["Speedup", comparison && comparison.speedup.toFixed(2), "×"],
            [
              "Time reduced",
              comparison && comparison.improvement_percent.toFixed(1),
              "%",
            ],
          ].map(([title, value, unit]) => (
            <div className="panel comparison-stat" key={title}>
              <span>{title}</span>
              <strong>
                {value || "—"}
                <small>{value ? unit : ""}</small>
              </strong>
              <p>{value ? "Measured, not estimated" : "Awaiting comparison"}</p>
            </div>
          ))}
        </div>
        {comparison && (
          <div className="panel comparison-chart">
            <h3>Execution time · lower is faster</h3>
            <div style={{ height: 180, width: "100%", minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  layout="vertical"
                  data={[
                    { name: "Sequential", ms: comparison.sequential.total_ms },
                    { name: "Parallel", ms: comparison.parallel.total_ms },
                  ]}
                  margin={{ top: 15, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke="#ffffff20" />
                  <XAxis
                    type="number"
                    unit=" ms"
                    tick={{ fontSize: 14, fill: "#bcbcbc" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={92}
                    tick={{ fontSize: 14, fill: "#bcbcbc" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#141414",
                      border: "1px solid #555",
                      borderRadius: 16,
                      color: "#fff",
                    }}
                    formatter={(value) => [
                      `${value.toFixed(2)} ms`,
                      "Execution time",
                    ]}
                    cursor={{ fill: "#ffffff0d" }}
                  />
                  <Bar
                    dataKey="ms"
                    barSize={24}
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  >
                    <Cell fill="#888888" />
                    <Cell fill="#efefef" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="formula">
              Speedup = {comparison.sequential.total_ms.toFixed(1)} ms ÷{" "}
              {comparison.parallel.total_ms.toFixed(1)} ms ={" "}
              <strong>{comparison.speedup.toFixed(2)}×</strong>
            </p>
            <p className="small muted">
              Time reduced = (1 − parallel time / sequential time) × 100.
              Results vary with scheduling and system load.
            </p>
          </div>
        )}
      </section>
      <WorkerReplay run={latest} />
      <section>
        <div className="section-heading">
          <h2>The architecture behind the demo</h2>
        </div>
        <div className="concept-grid">
          {concepts.map(([title, description, Icon]) => (
            <article key={title}>
              <Icon size={22} />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <div className="architecture-note">
          <strong>Concurrency, explained honestly.</strong>
          <p>
            ThreadPoolExecutor overlaps independent tasks. The simulated waiting
            releases Python’s Global Interpreter Lock (GIL), so threads can make
            progress concurrently. This is not evidence that Python threads
            speed up every CPU-bound calculation. Worker lanes illustrate task
            scheduling, not dedicated physical cores.
          </p>
          <code>Speedup = Sequential Time / Parallel Time</code>
        </div>
      </section>
    </div>
  );
}
