import AnimatedNumber from "./AnimatedNumber";
import { AlertCircle, Check, LoaderCircle, Info } from "lucide-react";
export function StatusBadge({ status = "Normal" }) {
  const tone = ["Critical", "High Risk", "Offline"].includes(status)
    ? "critical"
    : ["Warning", "Needs Attention"].includes(status)
      ? "warning"
      : ["Waiting", "Paused"].includes(status)
        ? "neutral"
        : "normal";
  return (
    <span className={`status ${tone}`}>
      {tone === "normal" ? (
        <Check size={12} />
      ) : tone === "critical" || tone === "warning" ? (
        <AlertCircle size={12} />
      ) : (
        <span className="status-dot" />
      )}
      {status}
    </span>
  );
}
export function ErrorNotice({ message, retry }) {
  return (
    <div className="error-notice" role="alert">
      <AlertCircle size={20} />
      <div>
        <strong>Something needs attention</strong>
        <p>{message}</p>
        {retry && (
          <button className="text-button" onClick={retry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
export function Loading({ text = "Loading…" }) {
  return (
    <span className="loading" role="status">
      <LoaderCircle size={17} className="spin" />
      {text}
    </span>
  );
}
export function Disclaimer() {
  return (
    <div className="disclaimer">
      <Info size={17} />
      <p>
        This application is an educational prototype developed for academic
        demonstration and is not intended for medical diagnosis or treatment.
        All ranges are simplified teaching examples, not medical advice.
      </p>
    </div>
  );
}
export function PageHeading({ title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <h1>
          {title.split(" ").slice(0, -1).join(" ")}{" "}
          <em>{title.split(" ").at(-1)}</em>
        </h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function HealthScore({ score, risk }) {
  return (
    <div className="score">
      <div className="section-heading">
        <h3>Overall Health Score</h3>
        <StatusBadge status={risk} />
      </div>
      <div className="score-number">
        <AnimatedNumber value={score} />
        <span> / 100</span>
      </div>
      <div
        className="score-track"
        role="progressbar"
        aria-label="Overall health score"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${score}%` }} />
      </div>
      <p>
        Average of five parameter scores. Critical findings and reported
        symptoms can raise the overall risk status.
      </p>
    </div>
  );
}
