/**
 * SimulationControls - Main control interface for simulation execution
 * Provides: Play/Pause/Reset buttons, speed control, and status display
 * Designed for integration with SimulationEngine (Phase 8+)
 */

import SimulationStatus from "./SimulationStatus";
import SimulationSpeedControl from "./SimulationSpeedControl";

export interface SimulationControlsProps {
  // State
  status: string;
  running: boolean;
  paused: boolean;
  simTime: number;
  simSpeed: number;
  loading: boolean;

  // Actions
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;

  // Optional
  disabled?: boolean;
}

export default function SimulationControls({
  status,
  running,
  paused,
  simTime,
  simSpeed,
  loading,
  onPlay,
  onPause,
  onReset,
  onStep,
  onSpeedChange,
  disabled = false,
}: SimulationControlsProps) {
  const isDisabled = disabled || loading;

  return (
    <div className="simulation-controls">
      {/* Status indicator */}
      <SimulationStatus
        status={status}
        running={running}
        paused={paused}
        simTime={simTime}
        simSpeed={simSpeed}
      />

      {/* Control buttons */}
      <div className="controls-section">
        <label className="control-label">Controls</label>
        <div className="button-group">
          {/* Play / Pause toggle */}
          {!running ? (
            <button
              className="btn-primary"
              onClick={onPlay}
              disabled={isDisabled}
              title="Start simulation"
            >
              ▶ Play
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={onPause}
              disabled={isDisabled}
              title="Pause simulation"
            >
              ⏸ Pause
            </button>
          )}

          {/* Step button - only available when paused */}
          <button
            className="btn-secondary"
            onClick={onStep}
            disabled={isDisabled || running}
            title="Step simulation by one frame"
          >
            ⏭ Step
          </button>

          {/* Reset button */}
          <button
            className="btn-secondary"
            onClick={onReset}
            disabled={isDisabled}
            title="Reset simulation to start"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Speed control */}
      <SimulationSpeedControl
        speed={simSpeed}
        onSpeedChange={onSpeedChange}
        disabled={isDisabled}
      />
    </div>
  );
}
