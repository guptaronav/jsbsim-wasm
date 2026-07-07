import { Suspense, lazy } from "react";
import { CHANNELS, getChannel } from "../../lib/channels";
import type { TelemetrySample } from "../../types";
import { CHART_SERIES_COLORS } from "../lib/chartColors";

const TelemetryChartCanvas = lazy(() => import("./TelemetryChartCanvas"));

interface TelemetryChartProps {
  samples: TelemetrySample[];
  seriesChannels: string[];
  onAddSeries: (channelId: string) => void;
  onRemoveSeries: (index: number) => void;
}

export default function TelemetryChart({
  samples,
  seriesChannels,
  onAddSeries,
  onRemoveSeries,
}: TelemetryChartProps): JSX.Element {
  const availableToAdd = CHANNELS.filter((c) => !seriesChannels.includes(c.id));

  return (
    <section className="mc-panel mc-chart-panel" aria-label="Telemetry chart">
      <div className="mc-chart-toolbar">
        <h2 className="mc-panel-title">Telemetry Chart</h2>
        <div className="mc-chart-legend">
          {seriesChannels.map((channelId, index) => (
            <span
              className="mc-legend-chip"
              key={channelId}
              style={{ borderColor: CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length] }}
            >
              <span
                className="mc-legend-swatch"
                style={{ background: CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length] }}
              />
              {getChannel(channelId)?.label ?? channelId}
              <button
                type="button"
                aria-label={`Remove ${getChannel(channelId)?.label ?? channelId} series`}
                onClick={() => onRemoveSeries(index)}
              >
                ×
              </button>
            </span>
          ))}
          {availableToAdd.length > 0 && (
            <label className="mc-legend-add">
              <span className="visually-hidden">Add series</span>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onAddSeries(e.target.value);
                }}
              >
                <option value="">+ series</option>
                {availableToAdd.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <Suspense fallback={<div className="mc-chart-loading">Loading chart…</div>}>
        <TelemetryChartCanvas samples={samples} seriesChannels={seriesChannels} />
      </Suspense>
    </section>
  );
}
