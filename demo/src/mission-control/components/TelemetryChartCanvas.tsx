import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getChannel, getChannelValue } from "../../lib/channels";
import type { TelemetrySample } from "../../types";
import { CHART_AXIS_COLOR, CHART_GRID_COLOR, CHART_SERIES_COLORS, CHART_TOOLTIP_BG } from "../lib/chartColors";

interface TelemetryChartCanvasProps {
  samples: TelemetrySample[];
  seriesChannels: string[];
}

type ChartRow = { time: number } & Record<string, number>;

function buildChartData(samples: TelemetrySample[], seriesChannels: string[]): ChartRow[] {
  return samples.map((sample) => {
    const row: ChartRow = { time: sample.time };
    for (const channelId of seriesChannels) {
      const value = getChannelValue(channelId, sample);
      if (value !== undefined) row[channelId] = value;
    }
    return row;
  });
}

export default function TelemetryChartCanvas({
  samples,
  seriesChannels,
}: TelemetryChartCanvasProps): JSX.Element {
  const data = buildChartData(samples, seriesChannels);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
        <XAxis
          dataKey="time"
          tickFormatter={(t: number) => t.toFixed(1)}
          stroke={CHART_AXIS_COLOR}
          fontSize={11}
          minTickGap={24}
        />
        <YAxis stroke={CHART_AXIS_COLOR} fontSize={11} width={48} />
        <Tooltip
          contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_GRID_COLOR}`, fontSize: 12 }}
          labelFormatter={(t: number) => `t=${t.toFixed(2)}s`}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {seriesChannels.map((channelId, i) => (
          <Line
            key={channelId}
            type="monotone"
            dataKey={channelId}
            name={getChannel(channelId)?.label ?? channelId}
            stroke={CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length]}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
