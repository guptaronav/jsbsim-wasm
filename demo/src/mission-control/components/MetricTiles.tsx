import { CHANNELS, getChannel, getChannelValue } from "../../lib/channels";
import type { TelemetrySample } from "../../types";

interface MetricTilesProps {
  sample: TelemetrySample | undefined;
  tileChannels: string[];
  onChangeTile: (index: number, channelId: string) => void;
  onRemoveTile: (index: number) => void;
  onAddTile: () => void;
}

function formatValue(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  const magnitude = Math.abs(value);
  const decimals = magnitude >= 100 ? 0 : magnitude >= 10 ? 1 : 2;
  return value.toFixed(decimals);
}

export default function MetricTiles({
  sample,
  tileChannels,
  onChangeTile,
  onRemoveTile,
  onAddTile,
}: MetricTilesProps): JSX.Element {
  return (
    <section className="mc-metric-bar" aria-label="Configurable telemetry tiles">
      {tileChannels.map((channelId, index) => {
        const channel = getChannel(channelId);
        const value = sample ? getChannelValue(channelId, sample) : undefined;
        return (
          <div className="mc-tile" key={`${channelId}-${index}`}>
            <div className="mc-tile-head">
              <label className="visually-hidden" htmlFor={`mc-tile-select-${index}`}>
                Metric tile {index + 1} channel
              </label>
              <select
                id={`mc-tile-select-${index}`}
                className="mc-tile-select"
                value={channelId}
                onChange={(e) => onChangeTile(index, e.target.value)}
              >
                {CHANNELS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="mc-tile-remove"
                aria-label={`Remove ${channel?.label ?? "metric"} tile`}
                onClick={() => onRemoveTile(index)}
              >
                ×
              </button>
            </div>
            <div className="mc-tile-value">
              <span className="mc-tile-number">{formatValue(value)}</span>
              <span className="mc-tile-unit">{channel?.unit}</span>
            </div>
          </div>
        );
      })}
      <button type="button" className="mc-tile-add" onClick={onAddTile}>
        + Tile
      </button>
    </section>
  );
}
