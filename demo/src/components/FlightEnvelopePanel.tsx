/**
 * FlightEnvelopePanel - Displays flight statistics and performance metrics
 * Shows max altitude, speed, range, flight time, and other telemetry
 */

import type { FlightStatistics } from "../lib/TrajectoryTracker";

interface FlightEnvelopePanelProps {
  statistics: FlightStatistics;
  isDarkMode?: boolean;
}

function formatAltitude(feet: number): string {
  return `${feet.toFixed(0)} ft`;
}

function formatSpeed(fps: number): string {
  return `${fps.toFixed(1)} ft/s`;
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${(km * 1000).toFixed(0)} m`;
  }
  return `${km.toFixed(2)} km`;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export default function FlightEnvelopePanel({
  statistics,
  isDarkMode = false,
}: FlightEnvelopePanelProps) {
  const stats = [
    { label: "Max Altitude", value: formatAltitude(statistics.maxAltitude) },
    { label: "Min Altitude", value: formatAltitude(statistics.minAltitude) },
    { label: "Max Speed", value: formatSpeed(statistics.maxSpeed) },
    { label: "Max Vertical", value: formatSpeed(statistics.maxVerticalVelocity) },
    { label: "Flight Time", value: formatTime(statistics.flightTime) },
    { label: "Range", value: formatDistance(statistics.range) },
    { label: "Points", value: `${statistics.pointCount}` },
  ];

  return (
    <div className="flight-envelope-panel">
      <h3 className="panel-title">Flight Envelope</h3>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-item">
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Altitude profile bar */}
      <div className="altitude-profile">
        <div className="profile-label">Altitude Profile</div>
        <div className="profile-bar">
          <div
            className="profile-min"
            style={{
              width: `${(statistics.minAltitude / statistics.maxAltitude) * 100 || 0}%`,
            }}
            title={`Min: ${formatAltitude(statistics.minAltitude)}`}
          />
          <div
            className="profile-max"
            style={{
              width: `${((statistics.maxAltitude - statistics.minAltitude) / statistics.maxAltitude) * 100 || 100}%`,
            }}
            title={`Max: ${formatAltitude(statistics.maxAltitude)}`}
          />
        </div>
      </div>

      {/* Performance indicators */}
      <div className="performance-indicators">
        <div className="indicator">
          <span className="indicator-label">Efficiency</span>
          <div className="indicator-bar">
            <div
              className="indicator-fill"
              style={{
                width: `${Math.min((statistics.range / statistics.maxAltitude) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
