import { JSBSimSdk } from "@sdk";
import type { AircraftState, SimulationEvent, Vector3 } from "../types";

export interface SimulationEngineConfig {
  targetFps: number; // Usually 60
  timeStepSeconds: number; // JSBSim integration dt (usually 0.02)
  maxTrajectoryPoints: number; // Max history to retain (e.g., 10000)
}

export interface SimulationEngineState {
  isRunning: boolean;
  isPaused: boolean;
  simTime: number;
  simSpeed: number;
  aircraftState: AircraftState;
  trajectoryHistory: Vector3[];
}

type SimulationEventListener = (event: SimulationEvent) => void;

/**
 * SimulationEngine manages the main simulation loop, aircraft state updates,
 * trajectory tracking, and event detection. It bridges JSBSim WASM with React state.
 */
export class SimulationEngine {
  private sdk: JSBSimSdk;
  private manifest: any; // ScenarioManifest - passed from parent
  private config: SimulationEngineConfig;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private state: SimulationEngineState = {
    isRunning: false,
    isPaused: false,
    simTime: 0,
    simSpeed: 1.0,
    aircraftState: this.defaultAircraftState(),
    trajectoryHistory: [],
  };
  private eventListeners: Set<SimulationEventListener> = new Set();
  private eventCounter: number = 0;
  private previousAircraftState: AircraftState = this.defaultAircraftState();

  constructor(
    sdk: JSBSimSdk,
    manifest: any,
    config: Partial<SimulationEngineConfig> = {}
  ) {
    this.sdk = sdk;
    this.manifest = manifest;
    this.config = {
      targetFps: config.targetFps ?? 60,
      timeStepSeconds: config.timeStepSeconds ?? 0.02,
      maxTrajectoryPoints: config.maxTrajectoryPoints ?? 10000,
    };
  }

  /** Initialize engine state without starting the loop */
  public initialize(): void {
    this.state = {
      isRunning: false,
      isPaused: false,
      simTime: 0,
      simSpeed: 1.0,
      aircraftState: this.readAircraftState(),
      trajectoryHistory: [],
    };
    this.previousAircraftState = { ...this.state.aircraftState };
  }

  /** Start the simulation loop */
  public start(): void {
    if (this.state.isRunning) return;
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.lastFrameTime = performance.now();
    this.tick();
  }

  /** Pause/resume the simulation (loop keeps running, but sim doesn't step) */
  public setPaused(paused: boolean): void {
    this.state.isPaused = paused;
  }

  /** Stop and reset the simulation loop */
  public stop(): void {
    this.state.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Set simulation speed multiplier (1.0 = real-time, 2.0 = 2x) */
  public setSimSpeed(speed: number): void {
    this.state.simSpeed = Math.max(0.1, Math.min(speed, 10.0)); // Clamp 0.1x to 10x
  }

  /** Advance simulation by one time step (for stepping mode) */
  public stepOnce(): void {
    if (!this.sdk) return;
    this.performSimulationStep();
  }

  /** Subscribe to simulation events */
  public onEvent(listener: SimulationEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /** Get current simulation state */
  public getState(): SimulationEngineState {
    return { ...this.state };
  }

  /** Set simulation time (for scrubbing, seeking) */
  public setSimTime(time: number): void {
    this.state.simTime = time;
  }

  /** Main tick function - called via requestAnimationFrame */
  private tick = (): void => {
    if (!this.state.isRunning) return;

    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = now;

    // Only step the simulation if not paused
    if (!this.state.isPaused) {
      // May skip frames if deltaTime is very large (browser lag)
      this.performSimulationStep();
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  /** Perform one simulation step and update state */
  private performSimulationStep(): void {
    if (!this.sdk) return;

    // Advance JSBSim by one time step
    const keepRunning = this.sdk.run();
    if (!keepRunning) {
      this.state.isRunning = false;
      this.emitEvent({
        type: "generic",
        level: "info",
        message: "Simulation ended",
      });
      return;
    }

    // Read new aircraft state
    this.previousAircraftState = { ...this.state.aircraftState };
    this.state.aircraftState = this.readAircraftState();
    this.state.simTime = this.sdk.getSimTime();

    // Update trajectory (sample every N steps to avoid bloat)
    // For now, sample every step; optimize later if needed
    this.recordTrajectoryPoint();

    // Detect and emit events based on state changes
    this.detectEvents();
  }

  /** Read aircraft state from JSBSim */
  private readAircraftState(): AircraftState {
    const m = this.manifest;
    const sdk = this.sdk;

    return {
      position: { x: 0, y: 0, z: 0 }, // TODO: Cartesian conversion in Phase 10
      velocity: { x: 0, y: 0, z: 0 }, // TODO: Velocity vector conversion
      attitude: {
        roll: sdk.getPropertyValue(m.telemetry.rollRad),
        pitch: sdk.getPropertyValue(m.telemetry.pitchRad),
        yaw: 0, // TODO: Read yaw from JSBSim
      },
      latitude: sdk.getPropertyValue(m.telemetry.latDeg),
      longitude: sdk.getPropertyValue(m.telemetry.lonDeg),
      altitude: sdk.getPropertyValue(m.telemetry.altitudeFt),
      airspeed: sdk.getPropertyValue(m.telemetry.airspeedFps),
      mach: 0, // TODO: Read Mach number from JSBSim
      verticalVelocity: sdk.getPropertyValue(m.telemetry.verticalVelocityFps),
    };
  }

  /** Record current aircraft position to trajectory history */
  private recordTrajectoryPoint(): void {
    const pos: Vector3 = {
      x: this.state.aircraftState.longitude,
      y: this.state.aircraftState.latitude,
      z: this.state.aircraftState.altitude,
    };

    this.state.trajectoryHistory.push(pos);

    // Enforce max trajectory size (FIFO eviction)
    if (this.state.trajectoryHistory.length > this.config.maxTrajectoryPoints) {
      this.state.trajectoryHistory.shift();
    }
  }

  /** Detect simulation events based on state changes */
  private detectEvents(): void {
    const prev = this.previousAircraftState;
    const curr = this.state.aircraftState;

    // Example: Altitude milestone (every 1000 ft)
    const prevAltThreshold = Math.floor(prev.altitude / 1000) * 1000;
    const currAltThreshold = Math.floor(curr.altitude / 1000) * 1000;
    if (currAltThreshold > prevAltThreshold && currAltThreshold > 0) {
      this.emitEvent({
        type: "altitude_milestone",
        level: "info",
        message: `Altitude milestone: ${currAltThreshold.toFixed(0)} ft`,
        data: { altitude: curr.altitude },
      });
    }

    // Example: Overspeed (> 500 ft/s)
    if (prev.airspeed <= 500 && curr.airspeed > 500) {
      this.emitEvent({
        type: "overspeed",
        level: "warning",
        message: `Overspeed! Airspeed: ${curr.airspeed.toFixed(1)} ft/s`,
        data: { airspeed: curr.airspeed },
      });
    }

    // Example: Stall (< 50 ft/s vertical velocity near ground)
    if (
      prev.verticalVelocity > 0 &&
      curr.verticalVelocity <= 0 &&
      curr.altitude < 5000
    ) {
      this.emitEvent({
        type: "stall",
        level: "warning",
        message: "Stall detected",
        data: { altitude: curr.altitude, verticalVelocity: curr.verticalVelocity },
      });
    }
  }

  /** Emit a simulation event to all listeners */
  private emitEvent(event: Omit<SimulationEvent, "id" | "timestamp" | "simTime">): void {
    const fullEvent: SimulationEvent = {
      id: this.eventCounter++,
      timestamp: Date.now(),
      simTime: this.state.simTime,
      type: event.type,
      level: event.level,
      message: event.message,
      data: event.data,
    };

    for (const listener of this.eventListeners) {
      listener(fullEvent);
    }
  }

  /** Default empty aircraft state */
  private defaultAircraftState(): AircraftState {
    return {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      attitude: { roll: 0, pitch: 0, yaw: 0 },
      latitude: 0,
      longitude: 0,
      altitude: 0,
      airspeed: 0,
      mach: 0,
      verticalVelocity: 0,
    };
  }
}
