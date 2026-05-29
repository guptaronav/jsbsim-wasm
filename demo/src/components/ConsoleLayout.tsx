/**
 * ConsoleLayout - Main integration point for the JSBSim flight simulation console
 * Coordinates all simulation components in a responsive multi-column layout
 * Bridges useSimulation state with visualization components
 */

import { useMemo, useState } from "react";
import type {
  AircraftState,
  EventEntry,
  FlightStage,
  SimulationEvent,
  StageState,
  StageTimes,
  TelemetrySample,
} from "../types";
import type { FlightStatistics, TrajectoryPoint } from "../lib/TrajectoryTracker";
import SimulationControls from "./SimulationControls";
import TrajectoryDisplay from "./TrajectoryDisplay";
import FlightEnvelopePanel from "./FlightEnvelopePanel";
import FlightViewer3D from "./FlightViewer3D";
import SimulationEventFeed from "./SimulationEventFeed";
import ParameterEditor, { type Parameter } from "./ParameterEditor";
import TelemetryCharts from "./TelemetryCharts";
import FlightStages from "./FlightStages";
import { exportAsCsv } from "../lib/exportData";

export interface ConsoleLayoutProps {
  status: string;
  loading: boolean;
  running: boolean;
  launched: boolean;
  launchConsumed: boolean;
  samples: TelemetrySample[];
  events: EventEntry[];
  intervalMs: number;
  stageState: StageState;
  stageTimes: StageTimes;
  currentStage: FlightStage | null;
  startLaunch: () => void;
  pauseResume: () => void;
  reload: () => void;
  setIntervalMs: (ms: number) => void;
  stepOnce: () => void;
  isDarkMode?: boolean;
}

const BASE_INTERVAL_MS = 50;
const DEFAULT_LAT = 37.4419;
const DEFAULT_LON = -122.143;

const DEFAULT_PARAMETERS: Parameter[] = [
  {
    id: "throttle",
    name: "Throttle",
    category: "Engine",
    value: 0,
    min: 0,
    max: 1,
    step: 0.01,
    unit: "%",
    description: "Engine throttle position",
  },
  {
    id: "elevator",
    name: "Elevator",
    category: "Controls",
    value: 0,
    min: -1,
    max: 1,
    step: 0.1,
    unit: "rad",
    description: "Pitch control surface",
  },
  {
    id: "aileron",
    name: "Aileron",
    category: "Controls",
    value: 0,
    min: -1,
    max: 1,
    step: 0.1,
    unit: "rad",
    description: "Roll control surface",
  },
  {
    id: "rudder",
    name: "Rudder",
    category: "Controls",
    value: 0,
    min: -1,
    max: 1,
    step: 0.1,
    unit: "rad",
    description: "Yaw control surface",
  },
];

function intervalToSpeed(ms: number): number {
  return Math.round((BASE_INTERVAL_MS / ms) * 100) / 100;
}

function speedToInterval(speed: number): number {
  return Math.max(10, Math.round(BASE_INTERVAL_MS / speed));
}

function sampleToPoint(sample: TelemetrySample): TrajectoryPoint {
  return {
    x: sample.lonDeg,
    y: sample.latDeg,
    z: sample.altitude,
    speed: sample.airspeedFps,
    verticalVelocity: sample.velocity,
  };
}

function sampleToAircraftState(sample: TelemetrySample): AircraftState {
  return {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    attitude: {
      pitch: sample.pitchRad,
      roll: sample.rollRad,
      yaw: 0,
    },
    latitude: sample.latDeg,
    longitude: sample.lonDeg,
    altitude: sample.altitude,
    airspeed: sample.airspeedFps,
    mach: 0,
    verticalVelocity: sample.velocity,
  };
}

function computeStatistics(samples: TelemetrySample[]): FlightStatistics {
  if (samples.length === 0) {
    return {
      maxAltitude: 0,
      minAltitude: 0,
      maxSpeed: 0,
      maxVerticalVelocity: 0,
      flightTime: 0,
      maxG: 0,
      range: 0,
      pointCount: 0,
    };
  }

  let maxAltitude = samples[0].altitude;
  let minAltitude = samples[0].altitude;
  let maxSpeed = 0;
  let maxVerticalVelocity = 0;

  for (const sample of samples) {
    maxAltitude = Math.max(maxAltitude, sample.altitude);
    minAltitude = Math.min(minAltitude, sample.altitude);
    maxSpeed = Math.max(maxSpeed, sample.airspeedFps);
    maxVerticalVelocity = Math.max(maxVerticalVelocity, Math.abs(sample.velocity));
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const flightTime = last.time - first.time;

  // Approximate horizontal range using Haversine
  const R = 6371;
  const dLat = (last.latDeg - first.latDeg) * (Math.PI / 180);
  const dLon = (last.lonDeg - first.lonDeg) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(first.latDeg * (Math.PI / 180)) *
      Math.cos(last.latDeg * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const range = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return {
    maxAltitude,
    minAltitude,
    maxSpeed,
    maxVerticalVelocity,
    flightTime,
    maxG: 0,
    range,
    pointCount: samples.length,
  };
}

function convertEvents(entries: EventEntry[]): SimulationEvent[] {
  return entries.map((entry) => ({
    id: entry.id,
    timestamp: entry.timestamp,
    simTime: entry.simTime,
    type: "generic" as const,
    level:
      entry.level === "warn"
        ? ("warning" as const)
        : entry.level === "error"
          ? ("critical" as const)
          : ("info" as const),
    message: entry.message,
  }));
}

const EMPTY_AIRCRAFT_STATE: AircraftState = {
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  attitude: { pitch: 0, roll: 0, yaw: 0 },
  latitude: DEFAULT_LAT,
  longitude: DEFAULT_LON,
  altitude: 0,
  airspeed: 0,
  mach: 0,
  verticalVelocity: 0,
};

export default function ConsoleLayout({
  status,
  loading,
  running,
  launched,
  launchConsumed,
  samples,
  events,
  intervalMs,
  stageState,
  stageTimes,
  currentStage,
  startLaunch,
  pauseResume,
  reload,
  setIntervalMs,
  stepOnce,
  isDarkMode = false,
}: ConsoleLayoutProps) {
  const [parameters, setParameters] = useState<Parameter[]>(DEFAULT_PARAMETERS);

  const trajectoryPoints = useMemo(() => samples.map(sampleToPoint), [samples]);

  const aircraftState = useMemo((): AircraftState => {
    const last = samples[samples.length - 1];
    return last ? sampleToAircraftState(last) : EMPTY_AIRCRAFT_STATE;
  }, [samples]);

  const flightStatistics = useMemo(() => computeStatistics(samples), [samples]);

  const simEvents = useMemo(() => convertEvents(events), [events]);

  const simTime = samples.length > 0 ? samples[samples.length - 1].time : 0;
  const simSpeed = intervalToSpeed(intervalMs);
  const isPaused = launched && !running;

  const refLat = samples.length > 0 ? samples[0].latDeg : DEFAULT_LAT;
  const refLon = samples.length > 0 ? samples[0].lonDeg : DEFAULT_LON;

  const handlePlay = () => {
    if (!launchConsumed) {
      startLaunch();
    } else {
      pauseResume();
    }
  };

  const handleSpeedChange = (speed: number) => {
    setIntervalMs(speedToInterval(speed));
  };

  const handleParameterChange = (id: string, value: number) => {
    setParameters((prev) => prev.map((p) => (p.id === id ? { ...p, value } : p)));
  };

  const statusIndicatorClass = running ? "running" : launched ? "paused" : "ready";
  const statusLabel = loading ? "LOADING" : running ? "RUNNING" : launched ? "PAUSED" : "READY";

  return (
    <div className={`console-layout ${isDarkMode ? "dark" : "light"}`}>
      {/* Header */}
      <header className="console-header">
        <div className="header-content">
          <h1 className="console-title">JSBSim Flight Console</h1>
          <div className="header-status">
            <div className={`status-indicator ${statusIndicatorClass}`} />
            <span className="status-text">{statusLabel}</span>
          </div>
        </div>
      </header>

      {/* Main content - responsive grid */}
      <main className="console-main">
        {/* Left column: 3D viewer (primary focus) */}
        <section className="console-section primary-viewer">
          <div className="section-container">
            <FlightViewer3D
              aircraftState={aircraftState}
              trajectoryPoints={trajectoryPoints}
              referenceLatitude={refLat}
              referenceLongitude={refLon}
              referenceAltitude={0}
              isRunning={running}
            />
          </div>
        </section>

        {/* Middle column: Control panel and trajectory */}
        <section className="console-section control-panel">
          <div className="section-container">
            {/* Controls */}
            <div className="panel-card">
              <SimulationControls
                status={status}
                running={running}
                paused={isPaused}
                simTime={simTime}
                simSpeed={simSpeed}
                loading={loading}
                onPlay={handlePlay}
                onPause={pauseResume}
                onStep={stepOnce}
                onReset={reload}
                onSpeedChange={handleSpeedChange}
              />
            </div>

            {/* Trajectory Display */}
            <div className="panel-card">
              <TrajectoryDisplay
                points={trajectoryPoints}
                currentPosition={trajectoryPoints[trajectoryPoints.length - 1]}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Flight Stats */}
            <div className="panel-card">
              <FlightEnvelopePanel
                statistics={flightStatistics}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Telemetry Charts */}
            <div className="panel-card">
              <TelemetryCharts samples={samples} isDarkMode={isDarkMode} />
            </div>
          </div>
        </section>

        {/* Right column: Events and parameters */}
        <section className="console-section event-panel">
          <div className="section-container">
            {/* Flight Stages */}
            <div className="panel-card">
              <FlightStages
                stageState={stageState}
                stageTimes={stageTimes}
                currentStage={currentStage}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Parameter Editor */}
            <div className="panel-card">
              <ParameterEditor
                parameters={parameters}
                onParameterChange={handleParameterChange}
                isDarkMode={isDarkMode}
                disabled={running}
              />
            </div>

            {/* Event Feed */}
            <div className="panel-card event-feed-card">
              <SimulationEventFeed events={simEvents} isDarkMode={isDarkMode} />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="console-footer">
        <div className="footer-content">
          <span className="footer-text">
            Events: {events.length} | Trajectory: {trajectoryPoints.length} points |
            Speed: {simSpeed.toFixed(1)}×
          </span>
          {samples.length > 0 && (
            <button
              className="btn-export"
              onClick={() => exportAsCsv(samples)}
              title="Export flight data as CSV"
            >
              ↓ Export CSV
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
