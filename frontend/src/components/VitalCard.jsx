import {
  Heart,
  Activity,
  Droplets,
  Thermometer,
  FlaskConical,
} from "lucide-react";
import { StatusBadge } from "./UI";
import AnimatedNumber from "./AnimatedNumber";
export const vitalIcons = {
  heart_rate: Heart,
  blood_pressure: Activity,
  spo2: Droplets,
  temperature: Thermometer,
  glucose: FlaskConical,
};
export default function VitalCard({
  metric,
  value,
  status = "Normal",
  message,
}) {
  const Icon = vitalIcons[metric.key];
  return (
    <article className="vital-card" style={{ "--signal": metric.color }}>
      <div className="vital-title">
        <Icon size={18} strokeWidth={1.8} />
        <span>{metric.label}</span>
      </div>
      <div className="vital-value">
        {typeof value === "number" ? (
          <AnimatedNumber
            value={value}
            decimals={metric.key === "temperature" ? 1 : 0}
          />
        ) : (
          <span>{value}</span>
        )}
        <small>{metric.unit}</small>
      </div>
      <div className="vital-bottom">
        <StatusBadge status={status} />
        {!message && <span className="vital-reference">{metric.range}</span>}
      </div>
      {message && <p className="vital-message">{message}</p>}
    </article>
  );
}
