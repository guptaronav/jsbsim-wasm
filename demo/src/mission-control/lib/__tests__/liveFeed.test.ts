import { describe, it, expect } from "vitest";
import { mergeLiveEvents, sensorReadingToLiveEvent, lifecycleEventToLiveEvent } from "../liveFeed";
import type { EventEntry } from "../../../types";
import type { SensorReading } from "../../../lib/sensors";

function makeEvent(overrides: Partial<EventEntry> = {}): EventEntry {
  return {
    id: 1,
    timestamp: 1000,
    simTime: 1.0,
    kind: "stage",
    level: "info",
    message: "Stage: LAUNCH at t=1.00s",
    ...overrides,
  };
}

function makeReading(overrides: Partial<SensorReading> = {}): SensorReading {
  return {
    channel: "imu.accel",
    simTime: 1.0,
    seq: 1,
    data: { x_g: 0.01, y_g: -0.02, z_g: 1.001 },
    ...overrides,
  };
}

describe("sensorReadingToLiveEvent", () => {
  it("formats the reading data into a readable message", () => {
    const event = sensorReadingToLiveEvent(makeReading());
    expect(event.message).toBe("x_g=0.010 y_g=-0.020 z_g=1.001");
    expect(event.level).toBe("info");
    expect(event.channel).toBe("imu.accel");
  });
});

describe("lifecycleEventToLiveEvent", () => {
  it("maps stage events to the lifecycle.stage channel", () => {
    const event = lifecycleEventToLiveEvent(makeEvent({ kind: "stage" }));
    expect(event.channel).toBe("lifecycle.stage");
  });

  it("maps warn level to warn", () => {
    const event = lifecycleEventToLiveEvent(makeEvent({ level: "warn", kind: "log" }));
    expect(event.level).toBe("warn");
    expect(event.channel).toBe("lifecycle.log");
  });

  it("maps error level to error", () => {
    const event = lifecycleEventToLiveEvent(makeEvent({ level: "error", kind: "alert" }));
    expect(event.level).toBe("error");
    expect(event.channel).toBe("lifecycle.alert");
  });
});

describe("mergeLiveEvents", () => {
  it("merges lifecycle and sensor events sorted by simTime", () => {
    const lifecycle = [makeEvent({ id: 1, simTime: 2.0 })];
    const sensors = [makeReading({ simTime: 1.0, seq: 1 })];
    const merged = mergeLiveEvents(lifecycle, sensors, 100);
    expect(merged.map((e) => e.simTime)).toEqual([1.0, 2.0]);
  });

  it("caps the merged feed to maxLength, keeping the most recent entries", () => {
    const sensors = Array.from({ length: 10 }, (_, i) => makeReading({ simTime: i, seq: i }));
    const merged = mergeLiveEvents([], sensors, 3);
    expect(merged).toHaveLength(3);
    expect(merged.map((e) => e.simTime)).toEqual([7, 8, 9]);
  });

  it("returns an empty array when given no events", () => {
    expect(mergeLiveEvents([], [], 10)).toEqual([]);
  });

  it("breaks ties at the same simTime using seq order", () => {
    const sensors = [
      makeReading({ simTime: 1, seq: 5 }),
      makeReading({ simTime: 1, seq: 2 }),
    ];
    const merged = mergeLiveEvents([], sensors, 10);
    expect(merged.map((e) => e.seq)).toEqual([2, 5]);
  });
});
