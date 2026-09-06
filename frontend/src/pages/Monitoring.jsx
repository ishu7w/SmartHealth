import { useEffect, useState } from "react";
import { Pause, Play, Radio } from "lucide-react";
import { metrics } from "../data/sampleData";
import VitalCard from "../components/VitalCard";
import HealthChart from "../components/HealthChart";
import { PageHeading, Disclaimer } from "../components/UI";
function reading() {
  return {
    time: new Date().toLocaleTimeString([], { hour12: false }),
    heart_rate: 68 + Math.floor(Math.random() * 16),
    spo2: 96 + Math.floor(Math.random() * 4),
    temperature: +(97.8 + Math.random() * 1.2).toFixed(1),
    systolic_bp: 110 + Math.floor(Math.random() * 19),
    diastolic_bp: 70 + Math.floor(Math.random() * 15),
  };
}
export default function Monitoring() {
  const [running, setRunning] = useState(true),
    [data, setData] = useState(() => [reading()]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => setData((old) => [...old.slice(-19), reading()]),
      3000,
    );
    return () => clearInterval(timer);
  }, [running]);
  const latest = data.at(-1);
  return (
    <div className="page-stack monitoring-page">
      <PageHeading
        title="A little closer to every signal."
        description="Health monitoring. Follow the rhythm of a simulated patient, three seconds at a time."
        action={
          <button
            className="button secondary"
            onClick={() => setRunning((value) => !value)}
          >
            {running ? (
              <>
                <Pause size={17} />
                Pause simulation
              </>
            ) : (
              <>
                <Play size={17} />
                Resume simulation
              </>
            )}
          </button>
        }
      />
      <div className={`simulation-banner ${running ? "streaming" : "paused"}`}>
        <div>
          <span className="stream-symbol">
            <Radio size={25} strokeWidth={1.5} />
          </span>
          <strong>Simulated Sensor Data</strong>
        </div>
        <span>
          {running ? "Updating every 3 seconds" : "Simulation paused"} ·{" "}
          {data.length}/20 readings retained
        </span>
      </div>
      <div className="vitals-rail monitoring-vitals">
        {metrics.slice(0, 4).map((metric) => (
          <VitalCard
            key={metric.key}
            metric={metric}
            value={
              metric.key === "blood_pressure"
                ? `${latest.systolic_bp} / ${latest.diastolic_bp}`
                : latest[metric.key]
            }
            status="Simulated"
          />
        ))}
      </div>
      <p className="small muted">
        Latest simulated reading:{" "}
        <strong data-testid="latest-reading">{latest.time}</strong>. Values are
        generated in your browser; no real sensors are connected.
      </p>
      <div className="monitor-charts">
        {metrics
          .filter(
            (metric) =>
              metric.key !== "blood_pressure" && metric.key !== "glucose",
          )
          .map((metric) => (
            <section className="panel" key={metric.key}>
              <div className="section-heading">
                <div>
                  <h2>{metric.label} trend</h2>
                  <p>Simulated readings · {metric.unit}</p>
                </div>
                <span className="live-mark" style={{ color: metric.color }}>
                  {latest[metric.key]} <small>{metric.unit}</small>
                </span>
              </div>
              <HealthChart data={data} metric={metric} height={225} />
              {data.length === 1 && (
                <p className="small muted">
                  The trend will appear as more readings arrive.
                </p>
              )}
            </section>
          ))}
      </div>
      <Disclaimer />
    </div>
  );
}
