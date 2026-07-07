/**
 * exportData - Utilities for exporting flight telemetry data
 */

import type { TelemetrySample } from "../types";
import { downloadTextFile } from "./downloadFile";

const CSV_HEADER =
  "time_s,altitude_ft,velocity_fps,acceleration_fps2,lat_deg,lon_deg,pitch_rad,roll_rad,airspeed_fps," +
  "yaw_rad,mach,vn_fps,ve_fps,vd_fps,roll_rate_rad_s,pitch_rate_rad_s,yaw_rate_rad_s,lat_accel_fps2,lon_accel_fps2";

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
    s.yawRad.toFixed(6),
    s.machNumber.toFixed(4),
    s.vnFps.toFixed(4),
    s.veFps.toFixed(4),
    s.vdFps.toFixed(4),
    s.rollRateRadPerSec.toFixed(6),
    s.pitchRateRadPerSec.toFixed(6),
    s.yawRateRadPerSec.toFixed(6),
    s.latAccelFps2.toFixed(4),
    s.lonAccelFps2.toFixed(4),
  ].join(",");
}

export function exportAsCsv(samples: TelemetrySample[], filename = "flight_data.csv"): void {
  const rows = [CSV_HEADER, ...samples.map(sampleToRow)];
  downloadTextFile(rows.join("\n"), filename, "text/csv");
}

export function exportAsJson(samples: TelemetrySample[], filename = "flight_data.json"): void {
  downloadTextFile(JSON.stringify({ samples }, null, 2), filename, "application/json");
}
