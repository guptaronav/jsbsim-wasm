/**
 * Pure sensor emitters — turn one telemetry sample into the realistic sensor
 * suite shown in the Live Events stream (IMU, gyro, GPS, baro, kinematics).
 * No React, no randomness beyond seed-derived jitter, so output is
 * reproducible for deterministic replay/scrubbing.
 */
import type { TelemetrySample } from "../types";

const FT_TO_M = 0.3048;
const RAD_TO_DEG = 180 / Math.PI;
const G_FPS2 = 32.174;

export type SensorChannel =
  | "imu.accel"
  | "imu.gyro"
  | "gps.fix"
  | "baro.sample"
  | "kinematics.sample";

export interface SensorReading {
  channel: SensorChannel;
  simTime: number;
  seq: number;
  data: Record<string, number>;
}

function seededJitter(seed: number, amplitude: number): number {
  return Math.sin(seed * 78.233) * amplitude;
}

function imuAccel(sample: TelemetrySample, seq: number): SensorReading {
  return {
    channel: "imu.accel",
    simTime: sample.time,
    seq,
    data: {
      x_g: sample.lonAccelFps2 / G_FPS2 + seededJitter(seq * 1.1, 0.01),
      y_g: sample.latAccelFps2 / G_FPS2 + seededJitter(seq * 1.3, 0.01),
      z_g: sample.acceleration / G_FPS2 + seededJitter(seq * 1.7, 0.01),
    },
  };
}

function imuGyro(sample: TelemetrySample, seq: number): SensorReading {
  return {
    channel: "imu.gyro",
    simTime: sample.time,
    seq,
    data: {
      roll_dps: sample.rollRateRadPerSec * RAD_TO_DEG + seededJitter(seq * 2.1, 0.05),
      pitch_dps: sample.pitchRateRadPerSec * RAD_TO_DEG + seededJitter(seq * 2.3, 0.05),
      yaw_dps: sample.yawRateRadPerSec * RAD_TO_DEG + seededJitter(seq * 2.7, 0.05),
    },
  };
}

function gpsFix(sample: TelemetrySample, seq: number): SensorReading {
  return {
    channel: "gps.fix",
    simTime: sample.time,
    seq,
    data: {
      lat: sample.latDeg,
      lon: sample.lonDeg,
      alt_m: sample.altitude * FT_TO_M,
      hdop: 0.9 + Math.abs(seededJitter(seq * 0.7, 0.3)),
    },
  };
}

function baroSample(sample: TelemetrySample, seq: number): SensorReading {
  return {
    channel: "baro.sample",
    simTime: sample.time,
    seq,
    data: {
      pressure_alt_m: sample.altitude * FT_TO_M + seededJitter(seq * 3.1, 0.4),
    },
  };
}

function kinematicsSample(sample: TelemetrySample, seq: number): SensorReading {
  return {
    channel: "kinematics.sample",
    simTime: sample.time,
    seq,
    data: {
      speed_mps: sample.airspeedFps * FT_TO_M,
      vertical_velocity_mps: sample.velocity * FT_TO_M,
      acceleration_mps2: sample.acceleration * FT_TO_M,
      mach: sample.machNumber,
    },
  };
}

/** Derive the full tick-rate sensor suite for a single telemetry sample. */
export function deriveSensorReadings(sample: TelemetrySample, seq: number): SensorReading[] {
  return [
    imuAccel(sample, seq),
    imuGyro(sample, seq),
    gpsFix(sample, seq),
    baroSample(sample, seq),
    kinematicsSample(sample, seq),
  ];
}
