/**
 * Pure time-index selectors over the append-only sample/event logs. These
 * power both the live view (implicitly, via the full arrays) and replay
 * scrubbing (by slicing/indexing to a chosen simTime).
 */
import type { TelemetrySample } from "../../types";
import type { LiveEvent } from "./liveFeed";

/** Index of the last sample whose time is <= t (binary search, ascending time). */
export function findFrameIndexAtTime(samples: readonly TelemetrySample[], t: number): number {
  if (samples.length === 0) return -1;
  if (t < samples[0].time) return 0;

  let lo = 0;
  let hi = samples.length - 1;
  let result = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].time <= t) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}

export function frameAtTime(samples: readonly TelemetrySample[], t: number): TelemetrySample | undefined {
  const idx = findFrameIndexAtTime(samples, t);
  return idx >= 0 ? samples[idx] : undefined;
}

export function samplesUpToTime(samples: readonly TelemetrySample[], t: number): TelemetrySample[] {
  const idx = findFrameIndexAtTime(samples, t);
  return idx >= 0 ? samples.slice(0, idx + 1) : [];
}

export function eventsUpToTime(events: readonly LiveEvent[], t: number): LiveEvent[] {
  return events.filter((e) => e.simTime <= t);
}
