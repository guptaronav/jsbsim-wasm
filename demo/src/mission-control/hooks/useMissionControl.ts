import { useEffect, useRef, useState } from "react";
import { useSimulation } from "../../hooks/useSimulation";
import { deriveSensorReadings, type SensorReading } from "../../lib/sensors";
import { generateSessionId } from "../lib/sessionId";

// Matches useSimulation's MAX_SAMPLES so a full session's sensor suite stays
// available for replay/scrubbing (5 readings emitted per telemetry sample).
const MAX_SENSOR_LOG = 20000;

export interface MissionControlState {
  sim: ReturnType<typeof useSimulation>;
  sessionId: string;
  sensorLog: SensorReading[];
}

/**
 * Layers sensor-reading generation and session identity on top of the core
 * simulation engine. Each new telemetry sample is expanded into the full
 * IMU/GPS/baro/kinematics sensor suite for the Live Events stream.
 */
export function useMissionControl(): MissionControlState {
  const sim = useSimulation();
  const [sensorLog, setSensorLog] = useState<SensorReading[]>([]);
  const [sessionId, setSessionId] = useState(() => generateSessionId());
  const processedCountRef = useRef(0);
  const seqRef = useRef(0);
  const wasLaunchedRef = useRef(false);

  useEffect(() => {
    if (sim.samples.length < processedCountRef.current) {
      // A reload/reset happened — samples array was cleared and restarted.
      processedCountRef.current = 0;
      seqRef.current = 0;
      setSensorLog([]);
    }

    const newSamples = sim.samples.slice(processedCountRef.current);
    processedCountRef.current = sim.samples.length;
    if (newSamples.length === 0) return;

    const newReadings = newSamples.flatMap((sample) => deriveSensorReadings(sample, seqRef.current++));
    setSensorLog((prev) => {
      const next = [...prev, ...newReadings];
      return next.length <= MAX_SENSOR_LOG ? next : next.slice(next.length - MAX_SENSOR_LOG);
    });
  }, [sim.samples]);

  useEffect(() => {
    if (sim.launched && !wasLaunchedRef.current) {
      setSessionId(generateSessionId());
    }
    wasLaunchedRef.current = sim.launched;
  }, [sim.launched]);

  return { sim, sessionId, sensorLog };
}
