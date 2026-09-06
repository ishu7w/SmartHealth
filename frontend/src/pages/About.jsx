import {
  ArrowRight,
  ClipboardPlus,
  Activity,
  Cpu,
  FileCheck2,
  Gauge,
  Database,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Disclaimer } from "../components/UI";
import SignalDiagram from "../components/SignalDiagram";
const steps = [
  ["Patient Input", ClipboardPlus],
  ["Health Data Analysis", Activity],
  ["Parallel Processing", Cpu],
  ["Result Generation", FileCheck2],
  ["Health Score", Gauge],
  ["Data Storage", Database],
];
export default function About() {
  return (
    <div className="page-stack about-page">
      <header className="about-heading">
        <span className="about-emblem">
          <Activity size={35} strokeWidth={1.5} />
        </span>
        <h1>
          Built to make
          <br />
          the invisible <em>understandable.</em>
        </h1>
        <p>Integrated Smart Healthcare Computing Solution</p>
        <span className="about-subject">
          Computer Architecture and Parallel Processing
        </span>
      </header>
      <section className="about-story">
        <div>
          <h2>
            A familiar subject.
            <br />A fundamental idea.
          </h2>
        </div>
        <div>
          <p>
            Healthcare gives computing a human context. A heart rate, an oxygen
            reading, a temperature—each can be understood independently.
          </p>
          <p>
            SmartHealth turns that independence into a practical question: what
            happens when we process those signals together?
          </p>
          <p>
            Enter patient parameters, inspect clear rules, and compare measured
            execution times. A focused academic prototype, designed to make
            concurrency visible.
          </p>
        </div>
      </section>
      <section className="compute-feature about-compute">
        <div className="compute-copy">
          <Cpu size={28} strokeWidth={1.4} />
          <h2>
            One input.
            <br />
            Five perspectives.
          </h2>
          <p>
            ThreadPoolExecutor schedules independent checks across five worker
            threads. Controlled waiting makes their overlap easy to observe.
          </p>
          <Link className="button light" to="/parallel">
            Explore the processing demo <ArrowRight size={16} />
          </Link>
        </div>
        <SignalDiagram />
      </section>
      <section className="workflow-section">
        <div className="section-heading">
          <h2>From input to insight.</h2>
          <p>The project workflow</p>
        </div>
        <div className="workflow">
          {steps.map(([name, Icon], i) => (
            <div className="workflow-step" key={name}>
              <span className="workflow-number">0{i + 1}</span>
              <Icon size={24} strokeWidth={1.5} />
              <strong>{name}</strong>
              {i < 5 && <ArrowRight className="workflow-arrow" size={15} />}
            </div>
          ))}
        </div>
        <p className="small muted">
          Standard analysis runs directly. The dedicated demo compares
          scheduling. Saving a record is always an explicit action.
        </p>
      </section>
      <section className="about-details">
        <div>
          <h2>Thoughtfully simple.</h2>
          <p>Every part of the stack has a clear job.</p>
          <dl className="tech-list">
            {[
              ["React + Vite", "The responsive interface"],
              ["Tailwind CSS + Lucide", "Layout and precise iconography"],
              ["FastAPI + Python", "Validated inputs and readable rules"],
              ["SQLite", "Local analysis records"],
              ["ThreadPoolExecutor", "Independent worker scheduling"],
              ["Recharts", "Signals and measured comparisons"],
              ["GSAP + Lenis", "Fluid feedback and motion"],
            ].map(([title, desc]) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{desc}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2>The ideas behind it.</h2>
          <p>Core concepts, ready to explain.</p>
          <ul className="about-concepts">
            {[
              [
                "Sequential processing",
                "One check finishes before the next begins.",
              ],
              [
                "Concurrency",
                "Independent tasks overlap using separate worker threads.",
              ],
              [
                "Performance measurement",
                "A high-resolution timer measures each task and the full execution.",
              ],
              [
                "Speedup",
                "Sequential duration divided by concurrent duration.",
              ],
              [
                "Rule-based health scoring",
                "Five transparent checks with scores of 100, 65, or 25. Their average gives the score; critical findings or symptoms can raise the risk status.",
              ],
            ].map(([title, text]) => (
              <li key={title}>
                <strong>{title}</strong>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="about-boundary">
        <div>
          <h2>Open the implementation.</h2>
          <p>
            No machine learning or connected medical sensors. Just independent
            Python functions and a documented API you can inspect.
          </p>
        </div>
        <a
          className="button secondary"
          href={`${(import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "")}/docs`}
          target="_blank"
          rel="noreferrer"
        >
          API documentation <ExternalLink size={15} />
        </a>
      </section>
      <Disclaimer />
    </div>
  );
}
