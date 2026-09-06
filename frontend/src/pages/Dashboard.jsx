import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Cpu,
  Database,
  Server,
  CircleCheck,
  Heart,
} from "lucide-react";
import { api } from "../services/api";
import { metrics, samplePatient, overviewData } from "../data/sampleData";
import VitalCard from "../components/VitalCard";
import HealthChart from "../components/HealthChart";
import SegmentedControl from "../components/SegmentedControl";
import SignalDiagram from "../components/SignalDiagram";
import { Loading, StatusBadge } from "../components/UI";
export default function Dashboard() {
  const [metricKey, setMetricKey] = useState("heart_rate"),
    [server, setServer] = useState("checking");
  const metric = metrics.find((item) => item.key === metricKey);
  async function check() {
    setServer("checking");
    try {
      await api.health();
      setServer("online");
    } catch {
      setServer("offline");
    }
  }
  useEffect(() => {
    check();
  }, []);
  return (
    <div className="page-stack dashboard-page">
      <section className="overview-heading">
        <div>
          <h1>Health, in <em>focus.</em></h1>
          <p>Understand the signals. Explore the computing behind them.</p>
        </div>
        <Link to="/analysis" className="button">
          Start Health Analysis <ArrowUpRight size={17} />
        </Link>
      </section>
      <section className="overview-surface">
        <div className="overview-title">
          <div className="sample-identity">
            <span className="patient-symbol">
              <Heart size={21} />
            </span>
            <div>
              <h2>Sample health overview</h2>
              <p>
                Demo Patient <span>·</span> 28 years <span>·</span> Female
              </p>
            </div>
          </div>
          <span className="sample-label">Sample patient data</span>
        </div>
        <div className="vitals-rail">
          {metrics.slice(0, 4).map((item) => (
            <VitalCard
              key={item.key}
              metric={item}
              value={
                item.key === "blood_pressure"
                  ? "118 / 78"
                  : samplePatient[item.key]
              }
            />
          ))}
        </div>
        <div className="overview-chart">
          <div className="chart-toolbar">
            <div>
              <h2>Health overview</h2>
              <p>Illustrative readings · 08:00–14:00</p>
            </div>
            <SegmentedControl
              label="Chart parameter"
              value={metricKey}
              onChange={setMetricKey}
              options={metrics
                .filter((m) =>
                  ["heart_rate", "spo2", "temperature"].includes(m.key),
                )
                .map((m) => ({ label: m.label, value: m.key }))}
            />
          </div>
          <div className="chart-current">
            <strong>
              {samplePatient[metricKey]}
              <span>{metric.unit}</span>
            </strong>
            <p>{metric.label} · latest sample</p>
          </div>
          <HealthChart data={overviewData} metric={metric} height={215} />
        </div>
        <div className="system-strip">
          <span>
            <Server size={15} />
            Analysis API{" "}
            {server === "checking" ? (
              <Loading text="Checking" />
            ) : (
              <StatusBadge
                status={server === "online" ? "Online" : "Offline"}
              />
            )}
          </span>
          <span>
            <Database size={15} />
            Storage{" "}
            <strong>{server === "online" ? "Connected" : "Unverified"}</strong>
          </span>
          <button
            className="text-button"
            disabled={server === "checking"}
            onClick={check}
          >
            {server === "offline" ? "Retry connection" : "Refresh status"}
            <ArrowUpRight size={14} />
          </button>
        </div>
      </section>
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
            Five independent health checks. See what changes when they run
            together.
          </p>
          <Link to="/parallel" className="button light">
            View Parallel Demo <ArrowRight size={17} />
          </Link>
          <span className="compute-note">
            Measured timings. Simulated workload.
          </span>
        </div>
        <SignalDiagram />
      </section>
      <section className="project-caption">
        <CircleCheck size={21} />
        <div>
          <h2>Integrated Smart Healthcare Computing Solution</h2>
          <p>
            An exploration of health monitoring and parallel processing, built
            for understanding.
          </p>
        </div>
        <Link className="text-button" to="/about">
          Explore the project <ArrowUpRight size={16} />
        </Link>
      </section>
    </div>
  );
}
