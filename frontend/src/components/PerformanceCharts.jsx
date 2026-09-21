import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
const tooltip = {
  background: "#161616",
  border: "1px solid #555",
  borderRadius: 12,
  color: "#fff",
};
export default function PerformanceCharts({ runs = [] }) {
  // One comparable point per size: the most recent measured comparison, never invented samples.
  const latest = new Map();
  [...runs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((r) => r.mode === "compare")
    .forEach((r) => {
      if (!latest.has(r.numberOfRecords)) latest.set(r.numberOfRecords, r);
    });
  const data = [...latest.values()].sort(
    (a, b) => a.numberOfRecords - b.numberOfRecords,
  );
  if (!data.length)
    return (
      <p className="empty-state">
        Run a comparison to build performance charts. Each point uses the latest
        comparison for that dataset size.
      </p>
    );
  return (
    <div className="performance-charts">
      {["Execution time (ms)", "Speedup (×)", "Processing modes (ms)"].map(
        (title, i) => {
          const Chart = i === 2 ? BarChart : LineChart;
          return (
            <section key={title}>
              <h3>{title}</h3>
              <div
                className="data-chart"
                role="img"
                aria-label={`${title} by dataset size. Exact measurements appear in the benchmark history table.`}
              >
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <Chart
                    data={data}
                    margin={{ top: 16, right: 12, left: 0, bottom: 12 }}
                  >
                    <CartesianGrid stroke="#ffffff18" vertical={false} />
                    <XAxis
                      dataKey="numberOfRecords"
                      tick={{ fill: "#bcbcbc", fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: "#bcbcbc", fontSize: 12 }}
                      width={55}
                    />
                    <Tooltip
                      contentStyle={tooltip}
                      labelFormatter={(v) => `${v} records`}
                    />
                    <Legend />
                    {i === 1 ? (
                      <Line
                        dataKey="speedup"
                        name="Speedup"
                        stroke="#d2e5b0"
                        isAnimationActive={false}
                      />
                    ) : i === 2 ? (
                      <>
                        <Bar
                          dataKey="sequentialTime"
                          name="Sequential"
                          fill="#aaa"
                          isAnimationActive={false}
                        />
                        <Bar
                          dataKey="parallelTime"
                          name="Parallel"
                          fill="#d2e5b0"
                          isAnimationActive={false}
                        />
                      </>
                    ) : (
                      <>
                        <Line
                          dataKey="sequentialTime"
                          name="Sequential"
                          stroke="#aaa"
                          isAnimationActive={false}
                        />
                        <Line
                          dataKey="parallelTime"
                          name="Parallel"
                          stroke="#d2e5b0"
                          isAnimationActive={false}
                        />
                      </>
                    )}
                  </Chart>
                </ResponsiveContainer>
              </div>
            </section>
          );
        },
      )}
      <p className="muted">
        X-axis: patient records. Runs may use different thread counts; see
        history before comparing points.
      </p>
    </div>
  );
}
