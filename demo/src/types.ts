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
  airspeedFps: number;
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
    airspeedFps: string;
  };
  rocket: {
    thrustLbf: number;
    burnDurationSec: number;
    launchDelaySec: number;
    touchdownAltitudeFt: number;
  };
  files: ScenarioFile[];
}

export type EventKind = "stage" | "log" | "alert";
export type EventLevel = "info" | "warn" | "error";

export interface EventEntry {
  id: number;
  timestamp: number;
  simTime: number;
  kind: EventKind;
  level: EventLevel;
  message: string;
}
