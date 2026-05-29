/**
 * SimulationStatus - Displays current simulation state with visual feedback
 * Shows: Running/Paused/Ready status with pulse animation and sim time
 */

interface SimulationStatusProps {
  status: string;
  running: boolean;
  paused: boolean;
  simTime: number; // Simulation time in seconds
  simSpeed: number; // Speed multiplier (1.0 = real-time)
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = (seconds % 60).toFixed(3);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs}`;
  }
  return `${mins}:${secs}`;
}

export default function SimulationStatus({
  status,
  running,
  paused,
  simTime,
  simSpeed,
}: SimulationStatusProps) {
  // Determine status color and icon
  let statusColor = "neutral"; // ready/idle
  let statusIcon = "●";
  let statusLabel = "Ready";

  if (running && !paused) {
    statusColor = "running";
    statusIcon = "●"; // Pulsing dot
    statusLabel = "Running";
  } else if (running && paused) {
    statusColor = "paused";
    statusIcon = "⏸";
    statusLabel = "Paused";
  } else if (status.includes("failed") || status.includes("error")) {
    statusColor = "error";
    statusIcon = "⚠";
    statusLabel = "Error";
  }

  return (
    <div className="simulation-status">
      {/* Status indicator */}
      <div className={`status-indicator status-${statusColor}`}>
        <span className={`status-icon ${running && !paused ? "pulse" : ""}`}>
          {statusIcon}
        </span>
        <div className="status-info">
          <div className="status-label">{statusLabel}</div>
          <div className="status-message">{status}</div>
        </div>
      </div>

      {/* Time display */}
      <div className="time-display">
        <div className="time-item">
          <span className="time-label">Sim Time</span>
          <span className="time-value">{formatTime(simTime)}</span>
        </div>
        <div className="time-item">
          <span className="time-label">Speed</span>
          <span className="time-value">{simSpeed.toFixed(1)}×</span>
        </div>
      </div>
    </div>
  );
}
