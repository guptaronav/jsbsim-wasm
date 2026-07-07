interface SimControlPanelProps {
  tickMs: number;
  durationMs: number;
  initialAltM: number;
  onTickMsChange: (ms: number) => void;
  onDurationMsChange: (ms: number) => void;
  onInitialAltMChange: (m: number) => void;
  loading: boolean;
  running: boolean;
  launched: boolean;
  launchConsumed: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function SimControlPanel({
  tickMs,
  durationMs,
  initialAltM,
  onTickMsChange,
  onDurationMsChange,
  onInitialAltMChange,
  loading,
  running,
  launched,
  launchConsumed,
  onStart,
  onStop,
}: SimControlPanelProps): JSX.Element {
  const fieldsDisabled = loading || running;
  const startDisabled = loading || running;
  const stopDisabled = loading || !running;
  const startLabel = !launchConsumed ? "Start" : !launched ? "Reload" : "Resume";

  return (
    <section className="mc-panel mc-sim-control" aria-label="Simulation control">
      <h2 className="mc-panel-title">Simulation Control</h2>

      <div className="mc-field-row">
        <label className="mc-field" htmlFor="mc-tick-ms">
          <span className="mc-field-label">tick_ms</span>
          <input
            id="mc-tick-ms"
            type="number"
            min={10}
            step={10}
            value={tickMs}
            disabled={fieldsDisabled}
            onChange={(e) => onTickMsChange(Math.max(10, Number(e.target.value) || 10))}
          />
        </label>
        <label className="mc-field" htmlFor="mc-duration-ms">
          <span className="mc-field-label">duration_ms</span>
          <input
            id="mc-duration-ms"
            type="number"
            min={1000}
            step={500}
            value={durationMs}
            disabled={fieldsDisabled}
            onChange={(e) => onDurationMsChange(Math.max(1000, Number(e.target.value) || 1000))}
          />
        </label>
        <label className="mc-field" htmlFor="mc-initial-alt">
          <span className="mc-field-label">initial_alt_m</span>
          <input
            id="mc-initial-alt"
            type="number"
            step={10}
            value={initialAltM}
            disabled={fieldsDisabled}
            onChange={(e) => onInitialAltMChange(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <div className="mc-button-row">
        <button
          type="button"
          className="mc-btn mc-btn--start"
          disabled={startDisabled}
          onClick={onStart}
        >
          {startLabel}
        </button>
        <button
          type="button"
          className="mc-btn mc-btn--stop"
          disabled={stopDisabled}
          onClick={onStop}
        >
          Stop
        </button>
      </div>
    </section>
  );
}
