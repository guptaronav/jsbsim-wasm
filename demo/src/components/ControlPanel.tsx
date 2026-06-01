import { useState, useCallback } from "react";
import type { JSBSimSdk } from "@sdk";
import type { TelemetrySample } from "../types";

interface ControlPanelProps {
  sdk: JSBSimSdk | null;
  loading: boolean;
  running: boolean;
  launched: boolean;
  launchConsumed: boolean;
  latest: TelemetrySample | undefined;
  intervalMs: number;
  onStartLaunch: () => void;
  onPauseResume: () => void;
  onReload: () => void;
  onSetIntervalMs: (ms: number) => void;
  onStepOnce: () => void;
  status: string;
}

const SPEED_OPTIONS: { label: string; ms: number }[] = [
  { label: "1×", ms: 50 },
  { label: "2×", ms: 25 },
  { label: "5×", ms: 10 },
  { label: "10×", ms: 5 },
  { label: "MAX", ms: 0 },
];

function formatNum(v: number, d = 2): string {
  return Number.isFinite(v) ? v.toFixed(d) : "n/a";
}

export default function ControlPanel({
  sdk,
  loading,
  running,
  launched,
  launchConsumed,
  latest,
  intervalMs,
  onStartLaunch,
  onPauseResume,
  onReload,
  onSetIntervalMs,
  onStepOnce,
  status,
}: ControlPanelProps) {
  const [propQuery, setPropQuery] = useState("");
  const [propResults, setPropResults] = useState<string[]>([]);
  const [selectedProp, setSelectedProp] = useState("");
  const [propValue, setPropValue] = useState("");
  const [propSetInput, setPropSetInput] = useState("");

  const searchProps = useCallback(() => {
    if (!sdk || !propQuery.trim()) return;
    try {
      const raw = sdk.queryPropertyCatalog(propQuery.trim(), "\n");
      const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 30);
      setPropResults(lines);
    } catch {
      setPropResults([]);
    }
  }, [sdk, propQuery]);

  const readProp = useCallback((prop: string) => {
    if (!sdk || !prop) return;
    try {
      const v = sdk.getPropertyValue(prop);
      setSelectedProp(prop);
      setPropValue(String(v));
      setPropSetInput(String(v));
    } catch {
      setPropValue("error");
    }
  }, [sdk]);

  const setProp = useCallback(() => {
    if (!sdk || !selectedProp) return;
    const num = parseFloat(propSetInput);
    if (!Number.isFinite(num)) return;
    sdk.setPropertyValue(selectedProp, num);
    readProp(selectedProp);
  }, [sdk, selectedProp, propSetInput, readProp]);

  return (
    <div className="control-panel">
      {/* Status */}
      <div className="status-bar">
        <span className="status-dot" style={{ background: loading ? "#94a3b8" : running ? "#22c55e" : "#f59e0b" }} />
        <span className="status-text">{status}</span>
      </div>

      {/* Primary controls */}
      <div className="control-section">
        <div className="button-row">
          <button onClick={onStartLaunch} disabled={loading || !sdk || launchConsumed} className="btn-primary">
            Launch
          </button>
          <button onClick={onPauseResume} disabled={loading || !sdk || !launchConsumed} className="btn-secondary">
            {running ? "⏸ Pause" : "▶ Resume"}
          </button>
          <button onClick={onStepOnce} disabled={loading || !sdk || running} className="btn-secondary">
            ⏭ Step
          </button>
          <button onClick={onReload} disabled={loading} className="btn-ghost">
            ↺ Reload
          </button>
        </div>
      </div>

      {/* Speed control */}
      <div className="control-section">
        <label className="control-label">Playback Speed</label>
        <div className="speed-buttons">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              className={`speed-btn ${intervalMs === opt.ms ? "active" : ""}`}
              onClick={() => onSetIntervalMs(opt.ms)}
              disabled={loading}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live telemetry summary */}
      {latest && (
        <div className="control-section">
          <label className="control-label">Live Telemetry</label>
          <div className="telem-grid">
            <div className="telem-item"><span>Time</span><strong>{formatNum(latest.time, 1)} s</strong></div>
            <div className="telem-item"><span>Alt</span><strong>{formatNum(latest.altitude, 0)} ft</strong></div>
            <div className="telem-item"><span>Vel</span><strong>{formatNum(latest.velocity, 1)} fps</strong></div>
            <div className="telem-item"><span>Accel</span><strong>{formatNum(latest.acceleration, 1)} fps²</strong></div>
            <div className="telem-item"><span>TAS</span><strong>{formatNum(latest.airspeedFps, 1)} fps</strong></div>
            <div className="telem-item"><span>Pitch</span><strong>{formatNum(latest.pitchRad * (180 / Math.PI), 1)}°</strong></div>
          </div>
        </div>
      )}

      {/* Property inspector */}
      <div className="control-section">
        <label className="control-label">Property Inspector</label>
        <div className="prop-search-row">
          <input
            className="prop-input"
            value={propQuery}
            onChange={(e) => setPropQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchProps()}
            placeholder="Search properties..."
          />
          <button className="btn-ghost" onClick={searchProps} disabled={!sdk}>
            Search
          </button>
        </div>

        {propResults.length > 0 && (
          <div className="prop-results">
            {propResults.map((p) => (
              <button
                key={p}
                className={`prop-result-item ${selectedProp === p ? "selected" : ""}`}
                onClick={() => readProp(p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {selectedProp && (
          <div className="prop-set-row">
            <span className="prop-selected-name">{selectedProp}</span>
            <span className="prop-current-value">{propValue}</span>
            <input
              className="prop-input prop-input--small"
              value={propSetInput}
              onChange={(e) => setPropSetInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setProp()}
              placeholder="New value"
            />
            <button className="btn-ghost" onClick={setProp} disabled={!sdk}>
              Set
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
