import { describe, it, expect } from "vitest";
import { deriveSensorReadings } from "../sensors";
import type { TelemetrySample } from "../../types";

function makeSample(overrides: Partial<TelemetrySample> = {}): TelemetrySample {
  return {
    time: 2.0,
    altitude: 500,
    velocity: 40,
    acceleration: 32.174,
    latDeg: 37.4419,
    lonDeg: -122.143,
    pitchRad: 0.1,
    rollRad: 0.05,
    yawRad: 0.2,
    airspeedFps: 250,
    machNumber: 0.22,
    vnFps: 150,
    veFps: 3,
    vdFps: -40,
    rollRateRadPerSec: 0.02,
    pitchRateRadPerSec: 0.03,
    yawRateRadPerSec: 0.01,
    latAccelFps2: 0.5,
    lonAccelFps2: 0.7,
    ...overrides,
  };
}

describe("deriveSensorReadings", () => {
  it("emits one reading per sensor channel", () => {
    const readings = deriveSensorReadings(makeSample(), 1);
    const channels = readings.map((r) => r.channel);
    expect(channels).toEqual(["imu.accel", "imu.gyro", "gps.fix", "baro.sample", "kinematics.sample"]);
  });

  it("stamps every reading with the sample's simTime and the given seq", () => {
    const sample = makeSample({ time: 7.25 });
    const readings = deriveSensorReadings(sample, 42);
    for (const reading of readings) {
      expect(reading.simTime).toBe(7.25);
      expect(reading.seq).toBe(42);
    }
  });

  it("is deterministic for the same sample and seq", () => {
    const sample = makeSample();
    const a = deriveSensorReadings(sample, 5);
    const b = deriveSensorReadings(sample, 5);
    expect(a).toEqual(b);
  });

  it("produces a GPS fix in degrees/meters derived from the sample", () => {
    const sample = makeSample({ latDeg: 10, lonDeg: 20, altitude: 1000 });
    const [, , gpsFix] = deriveSensorReadings(sample, 1);
    expect(gpsFix.data.lat).toBe(10);
    expect(gpsFix.data.lon).toBe(20);
    expect(gpsFix.data.alt_m).toBeCloseTo(304.8, 5);
  });

  it("converts kinematics sample fields to metric units", () => {
    const sample = makeSample({ airspeedFps: 100, velocity: 10, acceleration: 20 });
    const [, , , , kinematics] = deriveSensorReadings(sample, 1);
    expect(kinematics.data.speed_mps).toBeCloseTo(30.48, 5);
    expect(kinematics.data.vertical_velocity_mps).toBeCloseTo(3.048, 5);
    expect(kinematics.data.acceleration_mps2).toBeCloseTo(6.096, 5);
  });

  it("keeps jitter bounded to a small amplitude around the true value", () => {
    const sample = makeSample({ rollRateRadPerSec: 0 });
    const [, gyro] = deriveSensorReadings(sample, 3);
    expect(Math.abs(gyro.data.roll_dps)).toBeLessThan(1);
  });
});
