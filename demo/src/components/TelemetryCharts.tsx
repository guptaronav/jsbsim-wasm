/**
 * TelemetryCharts - Real-time telemetry visualization using recharts
 * Displays altitude and vertical velocity over simulation time
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TelemetrySample } from "../types";

interface TelemetryChartsProps {
  samples: TelemetrySample[];
  isDarkMode?: boolean;
}

interface ChartPoint {
  time: number;
  altitude: number;
  velocity: number;
}

const MAX_CHART_POINTS = 200;

function buildChartData(samples: TelemetrySample[]): ChartPoint[] {
  if (samples.length === 0) return [];
  const stride = samples.length <= MAX_CHART_POINTS ? 1 : Math.ceil(samples.length / MAX_CHART_POINTS);
  const result: ChartPoint[] = [];
  for (let i = 0; i < samples.length; i += stride) {
    const s = samples[i];
    result.push({
      time: Math.round(s.time * 100) / 100,
      altitude: Math.round(s.altitude * 10) / 10,
      velocity: Math.round(s.velocity * 10) / 10,
    });
  }
  return result;
}

function formatTime(t: number): string {
  return `${t.toFixed(1)}s`;
}

export default function TelemetryCharts({ samples, isDarkMode = false }: TelemetryChartsProps) {
  const data = buildChartData(samples);

  const gridColor = isDarkMode ? "#333" : "#e5e7eb";
  const textColor = isDarkMode ? "#9ca3af" : "#6b7280";
  const tooltipBg = isDarkMode ? "#1f2937" : "#fff";
  const tooltipBorder = isDarkMode ? "#374151" : "#e5e7eb";

  const tooltipStyle = {
    backgroundColor: tooltipBg,
    border: `1px solid ${tooltipBorder}`,
    borderRadius: "6px",
    fontSize: "12px",
    color: isDarkMode ? "#f9fafb" : "#111827",
  };

  if (data.length === 0) {
    return (
      <div className="telemetry-charts">
        <h3 className="panel-title">Telemetry</h3>
        <div className="chart-empty">
          <span>Waiting for flight data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="telemetry-charts">
      <h3 className="panel-title">Telemetry</h3>

      {/* Altitude chart */}
      <div className="chart-section">
        <div className="chart-label">Altitude (ft)</div>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              tick={{ fill: textColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: textColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={45}
              tickFormatter={(v: number) => `${v.toFixed(0)}`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} ft`, "Altitude"]}
              labelFormatter={(label: number) => `t=${label.toFixed(2)}s`}
              contentStyle={tooltipStyle}
            />
            <ReferenceLine y={0} stroke={gridColor} strokeWidth={1} />
            <Line
              type="monotone"
              dataKey="altitude"
              stroke="#0ea5e9"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Velocity chart */}
      <div className="chart-section">
        <div className="chart-label">Vertical Velocity (ft/s)</div>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              tick={{ fill: textColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: textColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={45}
              tickFormatter={(v: number) => `${v.toFixed(0)}`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} ft/s`, "Velocity"]}
              labelFormatter={(label: number) => `t=${label.toFixed(2)}s`}
              contentStyle={tooltipStyle}
            />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 2" />
            <Line
              type="monotone"
              dataKey="velocity"
              stroke="#10b981"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
