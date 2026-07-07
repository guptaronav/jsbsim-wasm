import { describe, it, expect } from "vitest";
import { eventsUpToTime, findFrameIndexAtTime, frameAtTime, samplesUpToTime } from "../sessionSelectors";
import type { TelemetrySample } from "../../../types";
import type { LiveEvent } from "../liveFeed";

function makeSample(time: number): TelemetrySample {
  return {
    time,
    altitude: time * 10,
    velocity: 0,
    acceleration: 0,
    latDeg: 0,
    lonDeg: 0,
    pitchRad: 0,
    rollRad: 0,
    yawRad: 0,
    airspeedFps: 0,
    machNumber: 0,
    vnFps: 0,
    veFps: 0,
    vdFps: 0,
    rollRateRadPerSec: 0,
    pitchRateRadPerSec: 0,
    yawRateRadPerSec: 0,
    latAccelFps2: 0,
    lonAccelFps2: 0,
  };
}

const SAMPLES = [0, 1, 2, 3, 4].map(makeSample);

describe("findFrameIndexAtTime", () => {
  it("returns -1 for an empty sample list", () => {
    expect(findFrameIndexAtTime([], 5)).toBe(-1);
  });

  it("finds the exact index when t matches a sample time", () => {
    expect(findFrameIndexAtTime(SAMPLES, 2)).toBe(2);
  });

  it("finds the last index with time <= t for an in-between t", () => {
    expect(findFrameIndexAtTime(SAMPLES, 2.7)).toBe(2);
  });

  it("clamps to the first index when t precedes all samples", () => {
    expect(findFrameIndexAtTime(SAMPLES, -5)).toBe(0);
  });

  it("clamps to the last index when t exceeds all samples", () => {
    expect(findFrameIndexAtTime(SAMPLES, 100)).toBe(4);
  });
});

describe("frameAtTime", () => {
  it("returns undefined for an empty list", () => {
    expect(frameAtTime([], 1)).toBeUndefined();
  });

  it("returns the sample at the resolved index", () => {
    expect(frameAtTime(SAMPLES, 3.2)?.time).toBe(3);
  });
});

describe("samplesUpToTime", () => {
  it("returns an empty array for an empty list", () => {
    expect(samplesUpToTime([], 1)).toEqual([]);
  });

  it("returns all samples up to and including t", () => {
    const result = samplesUpToTime(SAMPLES, 2.5);
    expect(result.map((s) => s.time)).toEqual([0, 1, 2]);
  });

  it("returns every sample when t exceeds the last sample's time", () => {
    expect(samplesUpToTime(SAMPLES, 999)).toHaveLength(5);
  });
});

describe("eventsUpToTime", () => {
  const events: LiveEvent[] = [0, 1, 2, 3].map((t) => ({
    id: `e${t}`,
    channel: "lifecycle.stage",
    simTime: t,
    seq: t,
    level: "info",
    message: `event at ${t}`,
  }));

  it("filters events whose simTime exceeds t", () => {
    const result = eventsUpToTime(events, 1.5);
    expect(result.map((e) => e.simTime)).toEqual([0, 1]);
  });

  it("returns an empty array when t precedes every event", () => {
    expect(eventsUpToTime(events, -1)).toEqual([]);
  });
});
