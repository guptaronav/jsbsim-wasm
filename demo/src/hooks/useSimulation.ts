import { useCallback, useEffect, useRef, useState } from "react";
import { JSBSimSdk } from "@sdk";
import type {
  EventEntry,
  FlightStage,
  ScenarioManifest,
  StageState,
  StageTimes,
  TelemetrySample,
} from "../types";
import { withBase } from "../lib/basePath";
import { getModelOverride } from "../lib/modelOverrideStore";

// High enough to hold a full session (tick_ms as low as 10ms, duration_ms up
// to several minutes) so replay/scrubbing can reach any point in the flight.
const MAX_SAMPLES = 20000;
const MAX_EVENTS = 20000;
const M_TO_FT = 1 / 0.3048;

const STAGE_SEQUENCE: FlightStage[] = [
  "launch",
  "burnout",
  "coast",
  "apogee",
  "descent",
  "landing",
];

function createStageState(): StageState {
  return {
    launch: false,
    burnout: false,
    coast: false,
    apogee: false,
    descent: false,
    landing: false,
  };
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function formatStartupError(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
    try { return JSON.stringify(error); } catch { return String(error); }
  }
  return "Unknown error";
}

let eventIdCounter = 0;
function nextEventId(): number {
  eventIdCounter += 1;
  return eventIdCounter;
}

export interface SimulationState {
  sdk: JSBSimSdk | null;
  manifest: ScenarioManifest | null;
  status: string;
  loading: boolean;
  running: boolean;
  launched: boolean;
  launchConsumed: boolean;
  samples: TelemetrySample[];
  events: EventEntry[];
  stageState: StageState;
  stageTimes: StageTimes;
  currentStage: FlightStage | null;
  intervalMs: number;
  durationMs: number;
  initialAltM: number;
}

export interface SimulationActions {
  startLaunch: () => void;
  pauseResume: () => void;
  reload: () => void;
  setIntervalMs: (ms: number) => void;
  setDurationMs: (ms: number) => void;
  setInitialAltM: (m: number) => void;
  stepOnce: () => void;
}

export function useSimulation(): SimulationState & SimulationActions {
  const sdkRef = useRef<JSBSimSdk | null>(null);
  const baselineAltRef = useRef(0);
  const launchStartTimeRef = useRef<number | null>(null);
  const latestSampleRef = useRef<TelemetrySample | null>(null);
  const stageStateRef = useRef<StageState>(createStageState());
  const stageTimesRef = useRef<StageTimes>({});
  const durationMsRef = useRef(15000);
  const initialAltMRef = useRef(0);

  const [manifest, setManifest] = useState<ScenarioManifest | null>(null);
  const [status, setStatus] = useState("Preparing simulation...");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [launchConsumed, setLaunchConsumed] = useState(false);
  const [samples, setSamples] = useState<TelemetrySample[]>([]);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [currentStage, setCurrentStage] = useState<FlightStage | null>(null);
  const [stageState, setStageState] = useState<StageState>(createStageState());
  const [stageTimes, setStageTimes] = useState<StageTimes>({});
  const [intervalMs, setIntervalMs] = useState(50);
  const [durationMs, setDurationMsState] = useState(15000);
  const [initialAltM, setInitialAltMState] = useState(0);

  const setDurationMs = useCallback((ms: number): void => {
    durationMsRef.current = ms;
    setDurationMsState(ms);
  }, []);

  const setInitialAltM = useCallback((m: number): void => {
    initialAltMRef.current = m;
    setInitialAltMState(m);
  }, []);

  const addEvent = useCallback((entry: Omit<EventEntry, "id">): void => {
    setEvents((prev) => {
      const next = [...prev, { ...entry, id: nextEventId() }];
      return next.length <= MAX_EVENTS ? next : next.slice(next.length - MAX_EVENTS);
    });
  }, []);

  const resetStageWidget = useCallback((): void => {
    const fresh = createStageState();
    stageStateRef.current = fresh;
    stageTimesRef.current = {};
    setStageState(fresh);
    setStageTimes({});
    setCurrentStage(null);
  }, []);

  const completeStage = useCallback((stage: FlightStage, time: number): void => {
    if (stageStateRef.current[stage]) return;
    const nextState = { ...stageStateRef.current, [stage]: true };
    const nextTimes = { ...stageTimesRef.current, [stage]: time };
    stageStateRef.current = nextState;
    stageTimesRef.current = nextTimes;
    setStageState(nextState);
    setStageTimes(nextTimes);
    setCurrentStage(stage);
    addEvent({
      timestamp: Date.now(),
      simTime: time,
      kind: "stage",
      level: "info",
      message: `Stage: ${stage.toUpperCase()} at t=${time.toFixed(2)}s`,
    });
  }, [addEvent]);

  const readTelemetry = useCallback((sdk: JSBSimSdk, m: ScenarioManifest): TelemetrySample => {
    const time = sdk.getSimTime();
    const rawAlt = sdk.getPropertyValue(m.telemetry.altitudeFt);
    const altitude = rawAlt - baselineAltRef.current;
    return {
      time,
      altitude,
      velocity: sdk.getPropertyValue(m.telemetry.verticalVelocityFps),
      acceleration: sdk.getPropertyValue(m.telemetry.verticalAccelerationFps2),
      latDeg: sdk.getPropertyValue(m.telemetry.latDeg),
      lonDeg: sdk.getPropertyValue(m.telemetry.lonDeg),
      pitchRad: sdk.getPropertyValue(m.telemetry.pitchRad),
      rollRad: sdk.getPropertyValue(m.telemetry.rollRad),
      yawRad: sdk.getPropertyValue(m.telemetry.yawRad),
      airspeedFps: sdk.getPropertyValue(m.telemetry.airspeedFps),
      machNumber: sdk.getPropertyValue(m.telemetry.machNumber),
      vnFps: sdk.getPropertyValue(m.telemetry.vnFps),
      veFps: sdk.getPropertyValue(m.telemetry.veFps),
      vdFps: sdk.getPropertyValue(m.telemetry.vdFps),
      rollRateRadPerSec: sdk.getPropertyValue(m.telemetry.rollRateRadPerSec),
      pitchRateRadPerSec: sdk.getPropertyValue(m.telemetry.pitchRateRadPerSec),
      yawRateRadPerSec: sdk.getPropertyValue(m.telemetry.yawRateRadPerSec),
      latAccelFps2: sdk.getPropertyValue(m.telemetry.latAccelFps2),
      lonAccelFps2: sdk.getPropertyValue(m.telemetry.lonAccelFps2),
    };
  }, []);

  const appendSample = useCallback((sample: TelemetrySample): void => {
    latestSampleRef.current = sample;
    setSamples((prev) => {
      const next = [...prev, sample];
      return next.length <= MAX_SAMPLES ? next : next.slice(next.length - MAX_SAMPLES);
    });
  }, []);

  const bootstrapScenario = useCallback(async (): Promise<void> => {
    setLoading(true);
    setRunning(false);
    setLaunched(false);
    setLaunchConsumed(false);
    setStatus("Loading scenario...");
    setSamples([]);
    setEvents([]);
    launchStartTimeRef.current = null;
    latestSampleRef.current = null;
    resetStageWidget();

    if (sdkRef.current) {
      sdkRef.current.destroy();
      sdkRef.current = null;
    }

    try {
      const manifestResp = await fetch(withBase("/scenario/hobby-rocket/manifest.json"));
      if (!manifestResp.ok) throw new Error(`Manifest fetch failed (${manifestResp.status})`);
      const nextManifest = (await manifestResp.json()) as ScenarioManifest;

      const sdk = await JSBSimSdk.create({
        moduleUrl: withBase("/wasm/jsbsim_wasm.mjs"),
        wasmUrl: withBase("/wasm/jsbsim_wasm.wasm"),
        log: { console: false, stripAnsi: true },
      });

      // JSBSim's stdout is a verbose model-load diagnostic dump (hundreds of
      // lines per boot) — not the curated lifecycle feed the console shows.
      // Only stderr (real warnings/errors) is surfaced as an event.
      sdk.on("stderr", (entry) => {
        addEvent({
          timestamp: entry.timestamp,
          simTime: sdkRef.current?.getSimTime() ?? 0,
          kind: "log",
          level: "error",
          message: entry.message,
        });
      });

      sdk.configurePaths({
        rootDir: "/runtime",
        aircraftPath: "aircraft",
        enginePath: "engine",
        systemsPath: "systems",
        outputPath: "output",
      });

      for (const file of nextManifest.files) {
        const override = getModelOverride(file.runtimePath);
        const bytes = override ? new TextEncoder().encode(override) : await fetchBytes(withBase(file.publicPath));
        sdk.writeDataFile(file.runtimePath, bytes);
      }

      const loaded = sdk.loadScript(nextManifest.scriptPath);
      if (!loaded) throw new Error(`Failed to load script: ${nextManifest.scriptPath}`);
      if (!sdk.runIc()) throw new Error("Failed to initialize simulation.");

      sdk.setPropertyValue(nextManifest.telemetry.thrustProperty, 0);
      baselineAltRef.current = sdk.getPropertyValue(nextManifest.telemetry.altitudeFt);

      const first = readTelemetry(sdk, nextManifest);
      sdkRef.current = sdk;
      setManifest(nextManifest);
      setSamples([first]);
      latestSampleRef.current = first;
      setStatus("Ready. Press Launch.");
      setLoading(false);
    } catch (error) {
      setStatus(`Startup failed: ${formatStartupError(error)}`);
      setLoading(false);
    }
  }, [addEvent, readTelemetry, resetStageWidget]);

  const runStep = useCallback((): void => {
    const sdk = sdkRef.current;
    const m = manifest;
    if (!sdk || !m) return;

    const launchStart = launchStartTimeRef.current;
    if (launched && launchStart !== null) {
      const elapsed = sdk.getSimTime() - launchStart;
      const thrust = elapsed >= 0 && elapsed <= m.rocket.burnDurationSec ? m.rocket.thrustLbf : 0;
      sdk.setPropertyValue(m.telemetry.thrustProperty, thrust);
    }

    const prevSample = latestSampleRef.current;
    const keepRunning = sdk.run();
    const sample = readTelemetry(sdk, m);
    appendSample(sample);

    if (!keepRunning) {
      setRunning(false);
      setLaunched(false);
      setStatus("Simulation ended.");
      addEvent({
        timestamp: Date.now(),
        simTime: sample.time,
        kind: "lifecycle",
        level: "info",
        message: "simulation_ended: JSBSim run loop terminated",
      });
      return;
    }

    if (!launched || launchStart === null) return;

    const elapsed = sample.time - launchStart;

    if (elapsed * 1000 >= durationMsRef.current) {
      sdk.setPropertyValue(m.telemetry.thrustProperty, 0);
      setRunning(false);
      setLaunched(false);
      setStatus("Duration limit reached.");
      addEvent({
        timestamp: Date.now(),
        simTime: sample.time,
        kind: "lifecycle",
        level: "info",
        message: "simulation_ended: duration limit reached",
      });
      return;
    }

    if (elapsed >= 0) completeStage("launch", sample.time);
    if (elapsed > m.rocket.burnDurationSec) completeStage("burnout", sample.time);
    if (stageStateRef.current.burnout && sample.velocity > 0) completeStage("coast", sample.time);

    if (
      stageStateRef.current.coast &&
      !stageStateRef.current.apogee &&
      prevSample &&
      prevSample.velocity > 0 &&
      sample.velocity <= 0
    ) {
      completeStage("apogee", sample.time);
      setStatus("Apogee reached.");
    }

    if (stageStateRef.current.apogee && sample.velocity < -0.5) completeStage("descent", sample.time);

    const touchedDown =
      elapsed > m.rocket.burnDurationSec + 0.8 &&
      sample.altitude <= m.rocket.touchdownAltitudeFt &&
      sample.velocity <= 0;

    if (touchedDown) {
      sdk.setPropertyValue(m.telemetry.thrustProperty, 0);
      completeStage("descent", sample.time);
      completeStage("landing", sample.time);
      setRunning(false);
      setLaunched(false);
      setStatus("Landing detected. Press Reload to fly again.");
      addEvent({
        timestamp: Date.now(),
        simTime: sample.time,
        kind: "lifecycle",
        level: "info",
        message: "simulation_ended: landing detected",
      });
      return;
    }

    if (elapsed < 0) { setStatus("Countdown..."); return; }
    if (!stageStateRef.current.burnout) { setStatus("Boost phase."); return; }
    if (!stageStateRef.current.apogee) { setStatus("Coasting."); return; }
    setStatus("Descent phase.");
  }, [addEvent, appendSample, completeStage, launched, manifest, readTelemetry]);

  // Sim loop
  useEffect(() => {
    if (!running || loading || !manifest || !sdkRef.current) return;
    const timer = window.setInterval(runStep, intervalMs);
    return () => window.clearInterval(timer);
  }, [loading, manifest, runStep, running, intervalMs]);

  // Bootstrap on mount
  useEffect(() => {
    void bootstrapScenario();
    return () => { sdkRef.current?.destroy(); sdkRef.current = null; };
  }, [bootstrapScenario]);

  const startLaunch = useCallback((): void => {
    const sdk = sdkRef.current;
    if (!sdk || !manifest || loading || launchConsumed) return;

    if (initialAltMRef.current !== 0) {
      const targetAltFt = baselineAltRef.current + initialAltMRef.current * M_TO_FT;
      sdk.setPropertyValue(manifest.telemetry.altitudeFt, targetAltFt);
      baselineAltRef.current = targetAltFt - initialAltMRef.current * M_TO_FT;
    }

    launchStartTimeRef.current = sdk.getSimTime() + manifest.rocket.launchDelaySec;
    setLaunchConsumed(true);
    setLaunched(true);
    setRunning(true);
    setStatus("Launch sequence armed.");
    addEvent({
      timestamp: Date.now(),
      simTime: sdk.getSimTime(),
      kind: "lifecycle",
      level: "info",
      message: "simulation_started",
    });
  }, [addEvent, launchConsumed, loading, manifest]);

  const pauseResume = useCallback((): void => {
    setRunning((v) => !v);
  }, []);

  const stepOnce = useCallback((): void => {
    if (loading || !sdkRef.current || !manifest) return;
    runStep();
  }, [loading, manifest, runStep]);

  return {
    sdk: sdkRef.current,
    manifest,
    status,
    loading,
    running,
    launched,
    launchConsumed,
    samples,
    events,
    stageState,
    stageTimes,
    currentStage,
    intervalMs,
    durationMs,
    initialAltM,
    startLaunch,
    pauseResume,
    reload: () => void bootstrapScenario(),
    setIntervalMs,
    setDurationMs,
    setInitialAltM,
    stepOnce,
  };
}

export { STAGE_SEQUENCE };
