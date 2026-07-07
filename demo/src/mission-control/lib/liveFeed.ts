/**
 * Pure formatting/merge helpers for the Live Events stream — turns raw
 * lifecycle events and sensor readings into one sorted, capped feed.
 */
import type { EventEntry } from "../../types";
import type { SensorReading } from "../../lib/sensors";

export type LiveEventLevel = "info" | "warn" | "error";

export interface LiveEvent {
  id: string;
  channel: string;
  simTime: number;
  seq: number;
  level: LiveEventLevel;
  message: string;
}

function formatReadingData(data: Record<string, number>): string {
  return Object.entries(data)
    .map(([key, value]) => `${key}=${value.toFixed(3)}`)
    .join(" ");
}

export function sensorReadingToLiveEvent(reading: SensorReading): LiveEvent {
  return {
    id: `${reading.channel}-${reading.seq}`,
    channel: reading.channel,
    simTime: reading.simTime,
    seq: reading.seq,
    level: "info",
    message: formatReadingData(reading.data),
  };
}

const KIND_TO_CHANNEL: Record<EventEntry["kind"], string> = {
  stage: "lifecycle.stage",
  log: "lifecycle.log",
  alert: "lifecycle.alert",
  lifecycle: "lifecycle.mission",
};

export function lifecycleEventToLiveEvent(entry: EventEntry): LiveEvent {
  const channel = KIND_TO_CHANNEL[entry.kind];
  const level: LiveEventLevel = entry.level === "warn" ? "warn" : entry.level === "error" ? "error" : "info";
  return {
    id: `lifecycle-${entry.id}`,
    channel,
    simTime: entry.simTime,
    seq: entry.id,
    level,
    message: entry.message,
  };
}

export function mergeLiveEvents(
  lifecycle: readonly EventEntry[],
  sensors: readonly SensorReading[],
  maxLength: number
): LiveEvent[] {
  const merged: LiveEvent[] = [
    ...lifecycle.map(lifecycleEventToLiveEvent),
    ...sensors.map(sensorReadingToLiveEvent),
  ];
  merged.sort((a, b) => a.simTime - b.simTime || a.seq - b.seq);
  return merged.length <= maxLength ? merged : merged.slice(merged.length - maxLength);
}
