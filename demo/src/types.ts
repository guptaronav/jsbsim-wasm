export type FlightStage = "launch" | "burnout" | "coast" | "apogee" | "descent" | "landing";

export type StageState = Record<FlightStage, boolean>;
export type StageTimes = Partial<Record<FlightStage, number>>;

export interface TelemetrySample {
  time: number;
  altitude: number;
  velocity: number;
  acceleration: number;
  latDeg: number;
  lonDeg: number;
  pitchRad: number;
  rollRad: number;
  yawRad: number;
  airspeedFps: number;
  machNumber: number;
  vnFps: number;
  veFps: number;
  vdFps: number;
  rollRateRadPerSec: number;
  pitchRateRadPerSec: number;
  yawRateRadPerSec: number;
  latAccelFps2: number;
  lonAccelFps2: number;
}

export interface ScenarioFile {
  runtimePath: string;
  publicPath: string;
}

export interface ScenarioManifest {
  scenario: string;
  model: string;
  scriptPath: string;
  telemetry: {
    altitudeFt: string;
    verticalVelocityFps: string;
    verticalAccelerationFps2: string;
    thrustProperty: string;
    latDeg: string;
    lonDeg: string;
    pitchRad: string;
    rollRad: string;
    yawRad: string;
    airspeedFps: string;
    machNumber: string;
    vnFps: string;  // north velocity component
    veFps: string;  // east velocity component
    vdFps: string;  // down velocity component
    rollRateRadPerSec: string;
    pitchRateRadPerSec: string;
    yawRateRadPerSec: string;
    latAccelFps2: string;
    lonAccelFps2: string;
  };
  rocket: {
    thrustLbf: number;
    burnDurationSec: number;
    launchDelaySec: number;
    touchdownAltitudeFt: number;
  };
  files: ScenarioFile[];
}

export type EventKind = "stage" | "log" | "alert" | "lifecycle";
export type EventLevel = "info" | "warn" | "error";

export interface EventEntry {
  id: number;
  timestamp: number;
  simTime: number;
  kind: EventKind;
  level: EventLevel;
  message: string;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface AircraftState {
  position: Vector3; // Cartesian world coordinates
  velocity: Vector3;
  attitude: {
    roll: number;
    pitch: number;
    yaw: number;
  };
  latitude: number;
  longitude: number;
  altitude: number;
  airspeed: number;
  mach: number;
  verticalVelocity: number;
}

export interface SimulationEngineState {
  isInitialized: boolean;
  isRunning: boolean;
  isPaused: boolean;
  currentTime: number; // Simulation time in seconds
  timeStep: number; // dt per frame in seconds
  simSpeed: number; // 1.0 = real-time, 2.0 = 2x speed
  aircraftState: AircraftState;
  trajectoryHistory: Vector3[];
  eventLog: SimulationEvent[];
}

export interface SimulationEvent {
  id: number;
  timestamp: number; // Real-world timestamp (ms)
  simTime: number; // Simulation time (seconds)
  type: "engine_start" | "gear_up" | "altitude_milestone" | "overspeed" | "stall" | "engine_stop" | "generic";
  level: "info" | "warning" | "critical";
  message: string;
  data?: Record<string, unknown>;
}
