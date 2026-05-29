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

export interface ModelEditorState {
  activeFile: string | null;
  fileContents: string;
  unsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ModelEditorActions {
  openFile: (filePath: string) => Promise<void>;
  saveFile: () => Promise<void>;
  closeEditor: () => void;
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
