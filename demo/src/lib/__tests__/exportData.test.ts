/**
 * exportData tests — CSV and JSON flight telemetry export utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportAsCsv, exportAsJson } from "../exportData";
import type { TelemetrySample } from "../../types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeSample = (overrides: Partial<TelemetrySample> = {}): TelemetrySample => ({
  time: 1.5,
  altitude: 1000.0,
  velocity: 200.0,
  acceleration: 50.0,
  latDeg: 37.4419,
  lonDeg: -122.143,
  pitchRad: 0.123456,
  rollRad: 0.001234,
  airspeedFps: 300.0,
  ...overrides,
});

// ---------------------------------------------------------------------------
// DOM mock helpers
// ---------------------------------------------------------------------------

function mockDownloadLink() {
  const link = { href: "", download: "", click: vi.fn() };
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "a") return link as unknown as HTMLAnchorElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (document as any).__proto__
      ? Object.getPrototypeOf(document).createElement.call(document, tag)
      : document.createElement(tag);
  });
  return link;
}

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  // jsdom doesn't implement URL.createObjectURL — provide a minimal stub
  global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test-url");
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// exportAsCsv
// ---------------------------------------------------------------------------

describe("exportAsCsv", () => {
  it("creates a Blob with text/csv MIME type", () => {
    const link = mockDownloadLink();
    exportAsCsv([makeSample()]);

    const blob = (global.URL.createObjectURL as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Blob;
    expect(blob.type).toBe("text/csv");
    expect(link.click).toHaveBeenCalledOnce();
  });

  it("uses the default filename when none supplied", () => {
    const link = mockDownloadLink();
    exportAsCsv([makeSample()]);
    expect(link.download).toBe("flight_data.csv");
  });

  it("uses a custom filename when supplied", () => {
    const link = mockDownloadLink();
    exportAsCsv([makeSample()], "my_flight.csv");
    expect(link.download).toBe("my_flight.csv");
  });

  it("revokes the object URL after triggering the download", () => {
    mockDownloadLink();
    exportAsCsv([makeSample()]);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
  });

  it("handles an empty samples array without throwing", () => {
    mockDownloadLink();
    expect(() => exportAsCsv([])).not.toThrow();
  });

  it("produces a CSV blob whose content starts with the header row", async () => {
    let captured: Blob | null = null;
    (global.URL.createObjectURL as ReturnType<typeof vi.fn>).mockImplementation(
      (b: Blob) => {
        captured = b;
        return "blob:test-url";
      }
    );
    mockDownloadLink();

    exportAsCsv([makeSample()]);

    const text = await captured!.text();
    expect(text).toMatch(
      /^time_s,altitude_ft,velocity_fps,acceleration_fps2,lat_deg,lon_deg,pitch_rad,roll_rad,airspeed_fps/
    );
  });

  it("encodes telemetry values correctly in the data row", async () => {
    let captured: Blob | null = null;
    (global.URL.createObjectURL as ReturnType<typeof vi.fn>).mockImplementation(
      (b: Blob) => {
        captured = b;
        return "blob:test-url";
      }
    );
    mockDownloadLink();

    const s = makeSample({
      time: 2.0,
      altitude: 500.5,
      velocity: 100.0,
      acceleration: 32.2,
      latDeg: 40.0,
      lonDeg: -105.0,
      pitchRad: 1.5708,
      rollRad: 0.0,
      airspeedFps: 150.0,
    });
    exportAsCsv([s]);

    const text = await captured!.text();
    const rows = text.split("\n");
    expect(rows).toHaveLength(2); // header + 1 data row
    const dataRow = rows[1];
    expect(dataRow).toContain("2.0000");
    expect(dataRow).toContain("500.5000");
    expect(dataRow).toContain("40.00000000");
    expect(dataRow).toContain("-105.00000000");
    expect(dataRow).toContain("1.570800");
  });

  it("produces one data row per sample", async () => {
    let captured: Blob | null = null;
    (global.URL.createObjectURL as ReturnType<typeof vi.fn>).mockImplementation(
      (b: Blob) => {
        captured = b;
        return "blob:test-url";
      }
    );
    mockDownloadLink();

    exportAsCsv([makeSample({ time: 0 }), makeSample({ time: 1 }), makeSample({ time: 2 })]);

    const text = await captured!.text();
    const rows = text.split("\n");
    expect(rows).toHaveLength(4); // header + 3 data rows
  });
});

// ---------------------------------------------------------------------------
// exportAsJson
// ---------------------------------------------------------------------------

describe("exportAsJson", () => {
  it("creates a Blob with application/json MIME type", () => {
    const link = mockDownloadLink();
    exportAsJson([makeSample()]);

    const blob = (global.URL.createObjectURL as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
    expect(link.click).toHaveBeenCalledOnce();
  });

  it("uses the default filename when none supplied", () => {
    const link = mockDownloadLink();
    exportAsJson([makeSample()]);
    expect(link.download).toBe("flight_data.json");
  });

  it("uses a custom filename when supplied", () => {
    const link = mockDownloadLink();
    exportAsJson([makeSample()], "mission.json");
    expect(link.download).toBe("mission.json");
  });

  it("revokes the object URL after triggering the download", () => {
    mockDownloadLink();
    exportAsJson([makeSample()]);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
  });

  it("handles an empty samples array without throwing", () => {
    mockDownloadLink();
    expect(() => exportAsJson([])).not.toThrow();
  });

  it("produces valid JSON containing a samples array", async () => {
    let captured: Blob | null = null;
    (global.URL.createObjectURL as ReturnType<typeof vi.fn>).mockImplementation(
      (b: Blob) => {
        captured = b;
        return "blob:test-url";
      }
    );
    mockDownloadLink();

    const s = makeSample({ time: 5.0, altitude: 2500.0 });
    exportAsJson([s]);

    const text = await captured!.text();
    const parsed = JSON.parse(text) as { samples: TelemetrySample[] };
    expect(parsed).toHaveProperty("samples");
    expect(parsed.samples).toHaveLength(1);
    expect(parsed.samples[0].time).toBe(5.0);
    expect(parsed.samples[0].altitude).toBe(2500.0);
  });

  it("preserves all telemetry fields in JSON output", async () => {
    let captured: Blob | null = null;
    (global.URL.createObjectURL as ReturnType<typeof vi.fn>).mockImplementation(
      (b: Blob) => {
        captured = b;
        return "blob:test-url";
      }
    );
    mockDownloadLink();

    const s = makeSample();
    exportAsJson([s]);

    const text = await captured!.text();
    const parsed = JSON.parse(text) as { samples: TelemetrySample[] };
    const sample = parsed.samples[0];

    expect(sample).toMatchObject({
      time: s.time,
      altitude: s.altitude,
      velocity: s.velocity,
      acceleration: s.acceleration,
      latDeg: s.latDeg,
      lonDeg: s.lonDeg,
      pitchRad: s.pitchRad,
      rollRad: s.rollRad,
      airspeedFps: s.airspeedFps,
    });
  });
});
