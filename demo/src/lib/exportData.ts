/**
 * exportData - Utilities for exporting flight telemetry data
 */

import type { TelemetrySample } from "../types";

const CSV_HEADER = "time_s,altitude_ft,velocity_fps,acceleration_fps2,lat_deg,lon_deg,pitch_rad,roll_rad,airspeed_fps";

function sampleToRow(s: TelemetrySample): string {
  return [
    s.time.toFixed(4),
    s.altitude.toFixed(4),
    s.velocity.toFixed(4),
    s.acceleration.toFixed(4),
    s.latDeg.toFixed(8),
    s.lonDeg.toFixed(8),
    s.pitchRad.toFixed(6),
    s.rollRad.toFixed(6),
    s.airspeedFps.toFixed(4),
  ].join(",");
}

export function exportAsCsv(samples: TelemetrySample[], filename = "flight_data.csv"): void {
  const rows = [CSV_HEADER, ...samples.map(sampleToRow)];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportAsJson(samples: TelemetrySample[], filename = "flight_data.json"): void {
  const json = JSON.stringify({ samples }, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
