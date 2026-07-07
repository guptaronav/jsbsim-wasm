import { describe, it, expect } from "vitest";
import { sampleToAircraftState, sampleToTrajectoryPoint } from "../telemetryAdapters";
import type { TelemetrySample } from "../../../types";

function makeSample(overrides: Partial<TelemetrySample> = {}): TelemetrySample {
  return {
    time: 1,
    altitude: 100,
    velocity: 20,
    acceleration: 5,
    latDeg: 10,
    lonDeg: 20,
    pitchRad: 0.1,
    rollRad: 0.2,
    yawRad: 0.3,
    airspeedFps: 150,
    machNumber: 0.15,
    vnFps: 100,
    veFps: 10,
    vdFps: -20,
    rollRateRadPerSec: 0,
    pitchRateRadPerSec: 0,
    yawRateRadPerSec: 0,
    latAccelFps2: 0,
    lonAccelFps2: 0,
    ...overrides,
  };
}

describe("sampleToTrajectoryPoint", () => {
  it("maps lon/lat/altitude to x/y/z", () => {
    const point = sampleToTrajectoryPoint(makeSample({ lonDeg: 20, latDeg: 10, altitude: 100 }));
    expect(point).toMatchObject({ x: 20, y: 10, z: 100 });
  });

  it("carries speed, vertical velocity, and acceleration", () => {
    const point = sampleToTrajectoryPoint(makeSample({ airspeedFps: 300, velocity: 40, acceleration: 12 }));
    expect(point.speed).toBe(300);
    expect(point.verticalVelocity).toBe(40);
    expect(point.acceleration).toBe(12);
  });
});

describe("sampleToAircraftState", () => {
  it("maps pitch/roll/yaw into attitude", () => {
    const state = sampleToAircraftState(makeSample({ pitchRad: 0.5, rollRad: 0.6, yawRad: 0.7 }));
    expect(state.attitude).toEqual({ pitch: 0.5, roll: 0.6, yaw: 0.7 });
  });

  it("maps position fields directly", () => {
    const state = sampleToAircraftState(makeSample({ latDeg: 1, lonDeg: 2, altitude: 3 }));
    expect(state.latitude).toBe(1);
    expect(state.longitude).toBe(2);
    expect(state.altitude).toBe(3);
  });

  it("maps airspeed and mach", () => {
    const state = sampleToAircraftState(makeSample({ airspeedFps: 250, machNumber: 0.3 }));
    expect(state.airspeed).toBe(250);
    expect(state.mach).toBe(0.3);
  });
});
