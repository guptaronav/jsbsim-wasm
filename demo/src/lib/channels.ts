/**
 * Typed channel registry — the single source of truth for every telemetry
 * value that can appear on a metric tile, a chart series, or an event row.
 * Pure and React-free so it can be shared by tiles, charts, and sensors.
 */
import type { TelemetrySample } from "../types";

const FT_TO_M = 0.3048;
const RAD_TO_DEG = 180 / Math.PI;

export type ChannelGroup = "kinematics" | "attitude" | "gps" | "link" | "mission";

export interface Channel {
  id: string;
  label: string;
  unit: string;
  group: ChannelGroup;
  /** Derive this channel's scalar value from a telemetry sample. */
  getValue: (sample: TelemetrySample) => number;
}

function deterministicJitter(seed: number, amplitude: number): number {
  // Pure, seed-derived "noise" — same seed always yields the same value, so
  // replay/scrubbing stays deterministic while tiles still look alive.
  return Math.sin(seed * 12.9898) * amplitude;
}

export const CHANNELS: readonly Channel[] = [
  {
    id: "mission.time",
    label: "Mission Time",
    unit: "s",
    group: "mission",
    getValue: (s) => s.time,
  },
  {
    id: "kinematics.altitude",
    label: "Altitude",
    unit: "m",
    group: "kinematics",
    getValue: (s) => s.altitude * FT_TO_M,
  },
  {
    id: "kinematics.speed",
    label: "Velocity",
    unit: "m/s",
    group: "kinematics",
    getValue: (s) => s.airspeedFps * FT_TO_M,
  },
  {
    id: "kinematics.vertical_velocity",
    label: "Vertical Velocity",
    unit: "m/s",
    group: "kinematics",
    getValue: (s) => s.velocity * FT_TO_M,
  },
  {
    id: "kinematics.acceleration",
    label: "Acceleration",
    unit: "m/s²",
    group: "kinematics",
    getValue: (s) => s.acceleration * FT_TO_M,
  },
  {
    id: "kinematics.mach",
    label: "Mach",
    unit: "M",
    group: "kinematics",
    getValue: (s) => s.machNumber,
  },
  {
    id: "attitude.roll",
    label: "Roll",
    unit: "°",
    group: "attitude",
    getValue: (s) => s.rollRad * RAD_TO_DEG,
  },
  {
    id: "attitude.pitch",
    label: "Pitch",
    unit: "°",
    group: "attitude",
    getValue: (s) => s.pitchRad * RAD_TO_DEG,
  },
  {
    id: "attitude.yaw",
    label: "Yaw",
    unit: "°",
    group: "attitude",
    getValue: (s) => s.yawRad * RAD_TO_DEG,
  },
  {
    id: "gps.lat",
    label: "Latitude",
    unit: "°",
    group: "gps",
    getValue: (s) => s.latDeg,
  },
  {
    id: "gps.lon",
    label: "Longitude",
    unit: "°",
    group: "gps",
    getValue: (s) => s.lonDeg,
  },
  {
    id: "link.rssi",
    label: "RSSI",
    unit: "dBm",
    group: "link",
    // Deterministic free-space-path-loss-style approximation: signal weakens
    // with altitude/range and carries a small seeded jitter.
    getValue: (s) => -60 - Math.min(60, s.altitude / 50) + deterministicJitter(s.time, 2),
  },
  {
    id: "link.snr",
    label: "SNR",
    unit: "dB",
    group: "link",
    getValue: (s) => Math.max(0, 12 - s.altitude / 800) + deterministicJitter(s.time * 1.7, 0.6),
  },
] as const;

const CHANNELS_BY_ID = new Map(CHANNELS.map((c) => [c.id, c]));

export function getChannel(id: string): Channel | undefined {
  return CHANNELS_BY_ID.get(id);
}

export function getChannelValue(id: string, sample: TelemetrySample): number | undefined {
  return CHANNELS_BY_ID.get(id)?.getValue(sample);
}

export const DEFAULT_TILE_CHANNELS: readonly string[] = [
  "kinematics.speed",
  "kinematics.acceleration",
  "kinematics.altitude",
  "mission.time",
  "link.rssi",
];

export const DEFAULT_CHART_CHANNELS: readonly string[] = [
  "kinematics.altitude",
  "kinematics.speed",
  "kinematics.acceleration",
];
