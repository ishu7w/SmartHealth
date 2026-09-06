import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
export default function HealthChart({ data, metric, height = 235 }) {
  return (
    <div
      style={{ height, minWidth: 0, width: "100%" }}
      role="img"
      aria-label={`${metric.label} chart with ${data.length} ${data.length > 1 ? "readings" : "reading"}, latest ${data.at(-1)?.[metric.key]} ${metric.unit}`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart
          data={data}
          margin={{ top: 12, right: 12, left: -25, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="#ffffff20"
            strokeDasharray="2 6"
          />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#bcbcbc", fontSize: 14 }}
            minTickGap={32}
            dy={10}
          />
          <YAxis
            domain={metric.domain}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#bcbcbc", fontSize: 14 }}
            tickCount={4}
          />
          <Tooltip
            contentStyle={{
              background: "#141414",
              color: "white",
              border: "1px solid #555",
              boxShadow: "none",
              borderRadius: 14,
              fontSize: 14,
            }}
            formatter={(value) => [`${value} ${metric.unit}`, metric.label]}
          />
          <Area
            type="monotone"
            dataKey={metric.key}
            stroke={metric.color}
            strokeWidth={2.2}
            fill={metric.color}
            fillOpacity={0.025}
            isAnimationActive={false}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
