/**
 * ConsoleLayout - Main integration point for the JSBSim flight simulation console
 * Coordinates all simulation components in a responsive multi-column layout
 * Phase 14: Full system integration with responsive design and state coordination
 */

import { useEffect, useRef, useState } from "react";
import SimulationEngine from "../lib/SimulationEngine";
import TrajectoryTracker from "../lib/TrajectoryTracker";
import type {
  AircraftState,
  SimulationEvent,
  SimulationEngineState,
  Vector3,
} from "../types";
import SimulationControls from "./SimulationControls";
import TrajectoryDisplay from "./TrajectoryDisplay";
import FlightEnvelopePanel from "./FlightEnvelopePanel";
import FlightViewer3D from "./FlightViewer3D";
import SimulationEventFeed from "./SimulationEventFeed";
import ParameterEditor, { type Parameter } from "./ParameterEditor";

interface ConsoleLayoutProps {
  isDarkMode?: boolean;
}

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

export default function ConsoleLayout({ isDarkMode = false }: ConsoleLayoutProps) {
  // Simulation state
  const engineRef = useRef<SimulationEngine | null>(null);
  const trackerRef = useRef<TrajectoryTracker | null>(null);

  const [engineState, setEngineState] = useState<SimulationEngineState>("ready");
  const [aircraftState, setAircraftState] = useState<AircraftState>({
    latitude: 37.4419,
    longitude: -122.143,
    altitude: 100,
    airspeed: 0,
    attitude: { pitch: 0, roll: 0, yaw: 0 },
  });
  const [trajectoryPoints, setTrajectoryPoints] = useState<Vector3[]>([]);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [parameters, setParameters] = useState<Parameter[]>(DEFAULT_PARAMETERS);
  const [referenceLatitude] = useState(37.4419);
  const [referenceLongitude] = useState(-122.143);
  const [referenceAltitude] = useState(100);

  // Initialize simulation engine
  useEffect(() => {
    const engine = new SimulationEngine();
    const tracker = new TrajectoryTracker();

    engineRef.current = engine;
    trackerRef.current = tracker;

    // State update handler
    const handleStateUpdate = (state: AircraftState, newEvents: SimulationEvent[]) => {
      setAircraftState(state);
      tracker.addPoint({
        x: state.longitude,
        y: state.latitude,
        z: state.altitude,
      });
      setTrajectoryPoints([...tracker.getDownsampledPoints()]);

      if (newEvents.length > 0) {
        setEvents((prev) => [...prev, ...newEvents]);
      }
    };

    // Register state update listener
    engine.on("stateupdate", handleStateUpdate);

    return () => {
      engine.stop();
    };
  }, []);

  // Coordinate simulation control commands
  const handlePlay = () => {
    if (engineRef.current) {
      engineRef.current.play();
      setEngineState("running");
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      setEngineState("paused");
    }
  };

  const handleStep = () => {
    if (engineRef.current) {
      engineRef.current.step();
    }
  };

  const handleReset = () => {
    if (engineRef.current && trackerRef.current) {
      engineRef.current.reset();
      trackerRef.current.clear();
      setTrajectoryPoints([]);
      setEvents([]);
      setEngineState("ready");
      setAircraftState({
        latitude: referenceLatitude,
        longitude: referenceLongitude,
        altitude: referenceAltitude,
        airspeed: 0,
        attitude: { pitch: 0, roll: 0, yaw: 0 },
      });
    }
  };

  const handleSpeedChange = (speed: number) => {
    setSpeedMultiplier(speed);
    if (engineRef.current) {
      engineRef.current.setSpeedMultiplier(speed);
    }
  };

  const handleParameterChange = (id: string, value: number) => {
    setParameters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, value } : p))
    );

    // Update simulation engine with new parameter value
    if (engineRef.current) {
      engineRef.current.setParameter(id, value);
    }
  };

  const isRunning = engineState === "running";

  return (
    <div className={`console-layout ${isDarkMode ? "dark" : "light"}`}>
      {/* Header */}
      <header className="console-header">
        <div className="header-content">
          <h1 className="console-title">JSBSim Flight Console</h1>
          <div className="header-status">
            <div className={`status-indicator ${engineState}`} />
            <span className="status-text">{engineState.toUpperCase()}</span>
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
              referenceLatitude={referenceLatitude}
              referenceLongitude={referenceLongitude}
              referenceAltitude={referenceAltitude}
              isRunning={isRunning}
            />
          </div>
        </section>

        {/* Middle column: Control panel and trajectory */}
        <section className="console-section control-panel">
          <div className="section-container">
            {/* Controls */}
            <div className="panel-card">
              <SimulationControls
                state={engineState}
                speedMultiplier={speedMultiplier}
                onPlay={handlePlay}
                onPause={handlePause}
                onStep={handleStep}
                onReset={handleReset}
                onSpeedChange={handleSpeedChange}
              />
            </div>

            {/* Trajectory Display */}
            <div className="panel-card">
              <TrajectoryDisplay
                trajectoryPoints={trajectoryPoints}
                aircraftState={aircraftState}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Flight Stats */}
            <div className="panel-card">
              <FlightEnvelopePanel
                altitude={aircraftState.altitude}
                airspeed={aircraftState.airspeed}
                verticalVelocity={0}
                flightTime={0}
                range={0}
                pointCount={trajectoryPoints.length}
              />
            </div>
          </div>
        </section>

        {/* Right column: Events and parameters */}
        <section className="console-section event-panel">
          <div className="section-container">
            {/* Parameter Editor */}
            <div className="panel-card">
              <ParameterEditor
                parameters={parameters}
                onParameterChange={handleParameterChange}
                isDarkMode={isDarkMode}
                disabled={isRunning}
              />
            </div>

            {/* Event Feed */}
            <div className="panel-card event-feed-card">
              <SimulationEventFeed events={events} isDarkMode={isDarkMode} />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="console-footer">
        <div className="footer-content">
          <span className="footer-text">
            Events: {events.length} | Trajectory: {trajectoryPoints.length} points |
            Speed: {speedMultiplier.toFixed(1)}×
          </span>
        </div>
      </footer>
    </div>
  );
}
