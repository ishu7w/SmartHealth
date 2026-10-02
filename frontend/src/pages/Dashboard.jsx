import { Link } from "react-router-dom";
import { ArrowUpRight, Cpu } from "lucide-react";
import { useSession } from "../components/Session";
import {
  useResource,
  ResourceState,
  ReadingsTable,
  when,
} from "../components/DataViews";
import { StatusBadge, Disclaimer } from "../components/UI";
import SignalDiagram from "../components/SignalDiagram";
import PerformanceCharts from "../components/PerformanceCharts";
import DemoSetup from "../components/DemoSetup";

export default function Dashboard() {
  const { user } = useSession();
  const staff = user.role !== "PATIENT";
  const stats = useResource("/dashboard/statistics"),
    readings = useResource("/health-records"),
    alerts = useResource("/alerts"),
    benchmarks = useResource(staff ? "/process/benchmarks" : null);
  const d = stats.data;
  return (
    <div className="page-stack dashboard-page">
      <section className="overview-heading">
        <div>
          <h1>
            Health, in <em>focus.</em>
          </h1>
          <p>
            {staff
              ? "A clear view of your patients, their signals, and system performance."
              : "Your measurements, history, and health signals in one place."}
          </p>
        </div>
        <Link to="/analysis" className="button">
          Add Health Reading <ArrowUpRight size={17} />
        </Link>
      </section>
      <section className="overview-surface">
        <div className="overview-title">
          <div>
            <h2>{staff ? "Healthcare overview" : "Your health overview"}</h2>
            <p>Saved records · {user.name}</p>
          </div>
          <button
            className="text-button"
            onClick={() => {
              stats.reload();
              readings.reload();
              alerts.reload();
              benchmarks.reload();
            }}
          >
            Refresh
          </button>
        </div>
        <ResourceState resource={stats}>
          {d && (
            <>
              <div className="stats-grid">
                {[
                  ["Total patients", d.totalPatients],
                  ["Normal patients", d.riskDistribution.Normal],
                  ["High risk patients", d.riskDistribution["High Risk"]],
                  ["Critical patients", d.riskDistribution.Critical],
                  ["Active alerts", d.activeAlerts],
                  ...(staff
                    ? [
                        [
                          "Records processed",
                          d.recordsProcessed.toLocaleString(),
                        ],
                        ["Tasks running now", d.parallelTasksRunning],
                        [
                          "Average run time",
                          `${d.averageProcessingTime.toFixed(2)} ms`,
                        ],
                      ]
                    : []),
                ].map(([label, value]) => (
                  <div className="stat-cell" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <div className="overview-chart">
                <h2>Patient risk distribution</h2>
                <p>
                  Latest reading per patient; profiles without readings are
                  shown separately.
                </p>
                <div className="risk-distribution">
                  {Object.entries(d.riskDistribution).map(([risk, count]) => (
                    <div className="risk-row" key={risk}>
                      <span>{risk}</span>
                      <div className="risk-track">
                        <i
                          style={{
                            width: `${d.totalPatients ? (count / d.totalPatients) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
                {staff && (
                  <p className="muted">
                    Processing totals and averages cover the latest{" "}
                    {d.benchmarkSampleSize} saved runs. Comparisons process each
                    dataset twice.
                  </p>
                )}
              </div>
            </>
          )}
        </ResourceState>
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Recent patient readings</h2>
          <Link className="text-button" to="/patients">
            View profiles
          </Link>
        </div>
        <ResourceState resource={readings}>
          <ReadingsTable records={readings.data?.slice(0, 5) || []} />
        </ResourceState>
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Recent alerts</h2>
          <Link className="text-button" to="/alerts">
            View all alerts
          </Link>
        </div>
        <ResourceState resource={alerts}>
          {alerts.data?.slice(0, 4).map((a) => (
            <div className="directory-row" key={a.id}>
              <div>
                <h3>
                  {a.patientName} · {a.parameter}
                </h3>
                <p>
                  {a.message} · {when(a.createdAt)} · {a.status}
                </p>
              </div>
              <StatusBadge status={a.riskLevel} />
            </div>
          ))}
          {alerts.data?.length === 0 && (
            <p className="empty-state">No alerts recorded.</p>
          )}
        </ResourceState>
      </section>
      {staff && (
        <>
          <section className="compute-feature">
            <div className="compute-copy">
              <span className="feature-icon">
                <Cpu size={24} />
              </span>
              <h2>
                A different way
                <br />
                to do the same work.
              </h2>
              <p>
                Thousands of independent patient records. Discover what changes
                when Java threads run them together.
              </p>
              <Link to="/parallel" className="button light">
                View Parallel Performance <ArrowUpRight size={17} />
              </Link>
              <span className="compute-note">
                Measured timings. Synthetic educational workload.
              </span>
            </div>
            <SignalDiagram />
          </section>
          <section className="panel">
            <h2>Processing performance</h2>
            <ResourceState resource={benchmarks}>
              <PerformanceCharts runs={benchmarks.data || []} />
            </ResourceState>
          </section>
        </>
      )}
      {user.role === "ADMIN" && (
        <DemoSetup
          onCreated={() => {
            stats.reload();
            readings.reload();
            alerts.reload();
          }}
        />
      )}
      <Disclaimer />
    </div>
  );
}
