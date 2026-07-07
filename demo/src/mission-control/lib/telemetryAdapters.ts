/**
 * Pure adapters from a raw TelemetrySample to the shapes FlightViewer3D and
 * the trajectory trackers expect.
 */
import type { AircraftState, TelemetrySample } from "../../types";
import type { TrajectoryPoint } from "../../lib/TrajectoryTracker";

export function sampleToTrajectoryPoint(sample: TelemetrySample): TrajectoryPoint {
  return {
    x: sample.lonDeg,
    y: sample.latDeg,
    z: sample.altitude,
    speed: sample.airspeedFps,
    verticalVelocity: sample.velocity,
    acceleration: sample.acceleration,
  };
}

export function sampleToAircraftState(sample: TelemetrySample): AircraftState {
  return {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    attitude: {
      pitch: sample.pitchRad,
      roll: sample.rollRad,
      yaw: sample.yawRad,
    },
    latitude: sample.latDeg,
    longitude: sample.lonDeg,
    altitude: sample.altitude,
    airspeed: sample.airspeedFps,
    mach: sample.machNumber,
    verticalVelocity: sample.velocity,
  };
}
