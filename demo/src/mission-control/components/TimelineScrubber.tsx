import { exportAsCsv, exportAsJson } from "../../lib/exportData";
import type { TelemetrySample } from "../../types";

interface TimelineScrubberProps {
  sessionId: string;
  samples: TelemetrySample[];
  isReplaying: boolean;
  scrubTime: number;
  isPlaying: boolean;
  speed: number;
  minTime: number;
  maxTime: number;
  onEnterReplay: () => void;
  onGoLive: () => void;
  onScrub: (t: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
}

const SPEED_OPTIONS = [0.5, 1, 2, 4];

export default function TimelineScrubber({
  sessionId,
  samples,
  isReplaying,
  scrubTime,
  isPlaying,
  speed,
  minTime,
  maxTime,
  onEnterReplay,
  onGoLive,
  onScrub,
  onTogglePlay,
  onSpeedChange,
}: TimelineScrubberProps): JSX.Element {
  const hasSamples = samples.length > 0;

  return (
    <section className="mc-panel mc-timeline" aria-label="Timeline scrubber">
      <div className="mc-timeline-row">
        <button
          type="button"
          className={`mc-btn mc-btn--ghost ${isReplaying ? "mc-btn--active" : ""}`}
          disabled={!hasSamples}
          onClick={isReplaying ? onGoLive : onEnterReplay}
        >
          {isReplaying ? "Live" : "Replay"}
        </button>

        <button
          type="button"
          className="mc-btn mc-btn--ghost"
          disabled={!isReplaying}
          onClick={onTogglePlay}
          aria-pressed={isPlaying}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <label className="mc-timeline-scrub">
          <span className="visually-hidden">Scrub to time</span>
          <input
            type="range"
            min={minTime}
            max={maxTime}
            step={0.05}
            value={isReplaying ? scrubTime : maxTime}
            disabled={!isReplaying}
            onChange={(e) => onScrub(Number(e.target.value))}
          />
        </label>

        <span className="mc-timeline-time">t={(isReplaying ? scrubTime : maxTime).toFixed(2)}s</span>

        <label className="mc-timeline-speed">
          <span className="visually-hidden">Playback speed</span>
          <select value={speed} disabled={!isReplaying} onChange={(e) => onSpeedChange(Number(e.target.value))}>
            {SPEED_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>

        <div className="mc-timeline-export">
          <button
            type="button"
            className="mc-btn mc-btn--ghost"
            disabled={!hasSamples}
            onClick={() => exportAsJson(samples, `${sessionId}.json`)}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="mc-btn mc-btn--ghost"
            disabled={!hasSamples}
            onClick={() => exportAsCsv(samples, `${sessionId}.csv`)}
          >
            Export CSV
          </button>
        </div>
      </div>
    </section>
  );
}
