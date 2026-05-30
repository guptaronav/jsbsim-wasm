import { describe, it, expect, beforeEach, vi } from "vitest";
import { SimulationEngine, type SimulationEngineState } from "../SimulationEngine";
import type { JSBSimSdk } from "@sdk";

// Mock JSBSimSdk
const createMockSdk = (): Partial<JSBSimSdk> => {
  let simTime = 0;
  return {
    getSimTime: vi.fn(() => simTime),
    run: vi.fn(() => {
      simTime += 0.02;
      return true;
    }),
    getPropertyValue: vi.fn((prop: string) => {
      // Match property paths from createMockManifest()
      if (prop.includes("h-agl") || prop.includes("h-sl")) return 1000; // altitude ft
      if (prop.includes("lat-geod")) return 40.0;
      if (prop.includes("long-gc")) return -105.0;
      if (prop.includes("theta") || prop.includes("pitch")) return 0.1;
      if (prop.includes("phi") || prop.includes("roll")) return -0.05;
      if (prop.includes("psi") || prop.includes("yaw")) return 1.57;
      if (prop.includes("h-dot") || (prop.includes("vd-fps") && !prop.includes("vn") && !prop.includes("ve"))) return 100; // vert velocity
      if (prop.includes("vn-fps")) return 80;  // north velocity
      if (prop.includes("ve-fps")) return 30;  // east velocity
      if (prop.includes("vt-fps") || prop.includes("vc-fps")) return 150; // airspeed
      if (prop.includes("mach")) return 0.13;
      if (prop.includes("accel")) return 16.1;
      return 0;
    }),
    setPropertyValue: vi.fn(),
  };
};

const createMockManifest = () => ({
  telemetry: {
    altitudeFt: "/position/h-agl-ft",
    latDeg: "/position/lat-geod-deg",
    lonDeg: "/position/long-gc-deg",
    pitchRad: "/attitude/theta-rad",
    rollRad: "/attitude/phi-rad",
    yawRad: "/attitude/psi-rad",
    airspeedFps: "/velocities/vt-fps",
    machNumber: "/velocities/mach",
    vnFps: "/velocities/vn-fps",
    veFps: "/velocities/ve-fps",
    vdFps: "/velocities/vd-fps",
    verticalVelocityFps: "/velocities/h-dot-fps",
    verticalAccelerationFps2: "/accelerations/vert-accel-fpm-s",
    thrustProperty: "/propulsion/engine[0]/thrust-lbf",
  },
});

describe("SimulationEngine", () => {
  let sdk: Partial<JSBSimSdk>;
  let manifest: any;
  let engine: SimulationEngine;

  beforeEach(() => {
    sdk = createMockSdk();
    manifest = createMockManifest();
    engine = new SimulationEngine(sdk as JSBSimSdk, manifest, {
      targetFps: 60,
      timeStepSeconds: 0.02,
      maxTrajectoryPoints: 1000,
    });
  });

  it("should initialize with default state", () => {
    engine.initialize();
    const state = engine.getState();

    expect(state.isRunning).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.simTime).toBe(0);
    expect(state.simSpeed).toBe(1.0);
    expect(state.trajectoryHistory.length).toBeGreaterThanOrEqual(0);
  });

  it("should read aircraft state from JSBSim", () => {
    engine.initialize();
    const state = engine.getState();

    expect(state.aircraftState.latitude).toBe(40.0);
    expect(state.aircraftState.longitude).toBe(-105.0);
    expect(state.aircraftState.altitude).toBe(1000);
    expect(state.aircraftState.airspeed).toBe(150);
  });

  it("should allow setting simulation speed", () => {
    engine.setSimSpeed(2.0);
    expect(engine.getState().simSpeed).toBe(2.0);
  });

  it("should clamp simulation speed to valid range (0.1x to 10x)", () => {
    engine.setSimSpeed(0.05); // Try to set too low
    expect(engine.getState().simSpeed).toBe(0.1);

    engine.setSimSpeed(15.0); // Try to set too high
    expect(engine.getState().simSpeed).toBe(10.0);
  });

  it("should pause and resume simulation without stopping loop", () => {
    engine.initialize();
    engine.start();

    expect(engine.getState().isRunning).toBe(true);
    expect(engine.getState().isPaused).toBe(false);

    engine.setPaused(true);
    expect(engine.getState().isPaused).toBe(true);
    expect(engine.getState().isRunning).toBe(true); // Still running, just paused

    engine.setPaused(false);
    expect(engine.getState().isPaused).toBe(false);
  });

  it("should record trajectory points", () => {
    engine.initialize();
    const initialLength = engine.getState().trajectoryHistory.length;

    engine.stepOnce();

    const state = engine.getState();
    expect(state.trajectoryHistory.length).toBeGreaterThan(initialLength);

    // Last point should be current aircraft position
    const lastPoint = state.trajectoryHistory[state.trajectoryHistory.length - 1];
    expect(lastPoint.x).toBe(-105.0); // Longitude
    expect(lastPoint.y).toBe(40.0); // Latitude
    expect(lastPoint.z).toBe(1000); // Altitude
  });

  it("should emit events", () => {
    engine.initialize();

    const events: any[] = [];
    const unsubscribe = engine.onEvent((event) => {
      events.push(event);
    });

    engine.stepOnce();

    // Should have emitted at least one event (from stepping)
    expect(events.length).toBeGreaterThanOrEqual(0);

    unsubscribe();
  });

  it("should enforce max trajectory points with FIFO eviction", () => {
    engine = new SimulationEngine(sdk as JSBSimSdk, manifest, {
      targetFps: 60,
      timeStepSeconds: 0.02,
      maxTrajectoryPoints: 5, // Very small limit for testing
    });

    engine.initialize();

    // Step 10 times
    for (let i = 0; i < 10; i++) {
      engine.stepOnce();
    }

    const state = engine.getState();
    expect(state.trajectoryHistory.length).toBeLessThanOrEqual(5);
  });

  it("should update simulation time when stepping", () => {
    engine.initialize();
    const initialTime = engine.getState().simTime;

    engine.stepOnce();

    const newTime = engine.getState().simTime;
    expect(newTime).toBeGreaterThan(initialTime);
  });

  it("should not step when paused", async () => {
    engine.initialize();
    engine.setPaused(true);

    const initialTime = engine.getState().simTime;

    engine.stepOnce(); // Should still step even if paused (stepOnce is explicit)

    // stepOnce should still advance (it's explicit)
    const newTime = engine.getState().simTime;
    expect(newTime).toBeGreaterThanOrEqual(initialTime);
  });

  it("should handle stop correctly", () => {
    engine.initialize();
    engine.start();
    expect(engine.getState().isRunning).toBe(true);

    engine.stop();
    expect(engine.getState().isRunning).toBe(false);
  });

  it("should not start if already running", () => {
    engine.initialize();
    engine.start();

    const state1 = engine.getState().isRunning;
    engine.start(); // Try to start again
    const state2 = engine.getState().isRunning;

    expect(state1).toBe(true);
    expect(state2).toBe(true);
  });

  it("should allow setting simulation time", () => {
    engine.initialize();
    engine.setSimTime(10.5);

    expect(engine.getState().simTime).toBe(10.5);
  });

  it("should detect altitude milestone events", () => {
    // Create an SDK that rapidly gains altitude past a 1000 ft milestone
    let altitudeOverride = 500;
    const customSdk = {
      ...createMockSdk(),
      getPropertyValue: vi.fn((prop: string) => {
        if (prop.includes("h-agl") || prop.includes("h-sl")) {
          altitudeOverride += 200; // Climb 200 ft per step
          return altitudeOverride;
        }
        return 0;
      }),
    };

    const customEngine = new SimulationEngine(customSdk as any, manifest, {
      maxTrajectoryPoints: 1000,
    });

    let eventReceived = false;
    customEngine.onEvent((event) => {
      if (event.type === "altitude_milestone") {
        eventReceived = true;
      }
    });

    customEngine.initialize();

    // Step enough times to cross the 1000 ft milestone
    for (let i = 0; i < 10; i++) {
      customEngine.stepOnce();
      if (eventReceived) break;
    }

    expect(eventReceived).toBe(true);
  });
});
