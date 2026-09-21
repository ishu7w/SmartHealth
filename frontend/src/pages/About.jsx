import { PageHeading, Disclaimer } from "../components/UI";
export default function About() {
  return (
    <div className="page-stack">
      <PageHeading
        title="Healthcare meets computing."
        description="Integrated Smart Healthcare Computing Solution · Computer Architecture & Parallel Processing"
      />
      <section className="panel">
        <span className="sample-label">SDG 3 · Good Health and Well-being</span>
        <h2>A platform built for understanding.</h2>
        <p>
          Patients track their own readings. Doctors review patient histories
          and respond to alerts. Administrators manage access and inspect system
          performance. The same rule-based analyzer powers saved readings and
          synthetic benchmark tasks.
        </p>
      </section>
      <section className="panel">
        <h2>From a reading to a result</h2>
        <div className="architecture-flow">
          {[
            "React interface",
            "Spring Security session",
            "Spring Boot REST API",
            "Health analysis",
            "MySQL records & alerts",
          ].map((step, i) => (
            <div key={step}>
              <small>0{i + 1}</small>
              <h3>{step}</h3>
            </div>
          ))}
        </div>
        <p>
          Patient ownership and staff roles are enforced by the server.
          Passwords are hashed with BCrypt, mutations require a CSRF token, and
          patient records stay in the database.
        </p>
      </section>
      <section className="panel">
        <h2>Two ways to process a dataset</h2>
        <div className="explanation-grid">
          <article>
            <h3>Sequential execution</h3>
            <p>
              A single thread processes each patient in order. The next record
              waits until the current record finishes. Wall-clock time is
              measured with System.nanoTime().
            </p>
          </article>
          <article>
            <h3>Parallel execution</h3>
            <p>
              ExecutorService schedules one Callable per patient across a fixed
              thread pool. Multiple CPU cores can execute independent tasks
              concurrently. Futures collect every result before the timer stops.
            </p>
          </article>
          <article>
            <h3>Shared memory & scheduling</h3>
            <p>
              Workers read an immutable dataset and produce independent outputs.
              An atomic counter reports active tasks. Thread scheduling, memory
              access, pool creation, and task submission all add overhead.
            </p>
          </article>
          <article>
            <h3>Speedup & practical limits</h3>
            <p>
              Speedup is sequential time divided by parallel time. Amdahl’s law
              limits gains when part of the work remains serial. More threads do
              not guarantee better performance; CPU availability, JIT
              compilation, and dataset size matter.
            </p>
          </article>
        </div>
        <p>
          The benchmark adds a disclosed, identical CPU-only calculation to each
          record so computational work is visible at classroom dataset sizes. It
          is an educational workload, not a measure of clinical processing
          capacity. The first 50 records warm the analyzer; sample task timings
          show the first 100 records. Process CPU time includes other JVM work.
        </p>
      </section>
      <section className="panel">
        <h2>How the demonstration scores risk</h2>
        <p>
          Six parameters contribute equally. An in-range value scores 0, a
          warning scores 60, and a critical value scores 100. The rounded mean
          is raised to at least 26 for any warning and at least 76 for any
          critical signal. This prevents a serious signal from disappearing in
          an average.
        </p>
        <div className="stats-grid">
          {[
            ["0–25", "Normal"],
            ["26–50", "Attention Required"],
            ["51–75", "High Risk"],
            ["76–100", "Critical"],
          ].map(([score, label]) => (
            <div className="stat-cell" key={score}>
              <span>{label}</span>
              <strong>{score}</strong>
            </div>
          ))}
        </div>
        <p>
          Temperature is recorded in Celsius. Blood pressure uses both systolic
          and diastolic values. Glucose uses a simplified fasting range.
          Monitoring generates synthetic data; it does not connect to a medical
          device or dispatch emergency services.
        </p>
      </section>
      <Disclaimer />
    </div>
  );
}
