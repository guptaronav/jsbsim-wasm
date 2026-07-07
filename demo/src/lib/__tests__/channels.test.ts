import { describe, it, expect } from "vitest";
import { CHANNELS, getChannel, getChannelValue, DEFAULT_TILE_CHANNELS, DEFAULT_CHART_CHANNELS } from "../channels";
import type { TelemetrySample } from "../../types";

function makeSample(overrides: Partial<TelemetrySample> = {}): TelemetrySample {
  return {
    time: 3.5,
    altitude: 1000,
    velocity: 50,
    acceleration: 64.348, // 2g in fps2
    latDeg: 37.4419,
    lonDeg: -122.143,
    pitchRad: Math.PI / 4,
    rollRad: Math.PI / 6,
    yawRad: Math.PI / 2,
    airspeedFps: 300,
    machNumber: 0.27,
    vnFps: 190,
    veFps: 5,
    vdFps: -50,
    rollRateRadPerSec: 0.1,
    pitchRateRadPerSec: 0.2,
    yawRateRadPerSec: 0.05,
    latAccelFps2: 1,
    lonAccelFps2: 2,
    ...overrides,
  };
}

describe("channels registry", () => {
  it("has unique channel ids", () => {
    const ids = CHANNELS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves a known channel by id", () => {
    expect(getChannel("kinematics.altitude")?.label).toBe("Altitude");
  });

  it("returns undefined for an unknown channel id", () => {
    expect(getChannel("nope")).toBeUndefined();
    expect(getChannelValue("nope", makeSample())).toBeUndefined();
  });

  it("converts altitude from feet to meters", () => {
    const value = getChannelValue("kinematics.altitude", makeSample({ altitude: 1000 }));
    expect(value).toBeCloseTo(304.8, 5);
  });

  it("converts airspeed to a velocity channel in m/s", () => {
    const value = getChannelValue("kinematics.speed", makeSample({ airspeedFps: 100 }));
    expect(value).toBeCloseTo(30.48, 5);
  });

  it("converts roll radians to degrees", () => {
    const value = getChannelValue("attitude.roll", makeSample({ rollRad: Math.PI }));
    expect(value).toBeCloseTo(180, 5);
  });

  it("produces the same RSSI value for the same sample (deterministic)", () => {
    const sample = makeSample({ time: 4.2, altitude: 500 });
    const a = getChannelValue("link.rssi", sample);
    const b = getChannelValue("link.rssi", sample);
    expect(a).toBe(b);
  });

  it("weakens RSSI as altitude increases", () => {
    const low = getChannelValue("link.rssi", makeSample({ time: 1, altitude: 0 }))!;
    const high = getChannelValue("link.rssi", makeSample({ time: 1, altitude: 3000 }))!;
    expect(high).toBeLessThan(low);
  });

  it("every default tile channel resolves to a registered channel", () => {
    for (const id of DEFAULT_TILE_CHANNELS) {
      expect(getChannel(id)).toBeDefined();
    }
  });

  it("every default chart channel resolves to a registered channel", () => {
    for (const id of DEFAULT_CHART_CHANNELS) {
      expect(getChannel(id)).toBeDefined();
    }
  });
});
