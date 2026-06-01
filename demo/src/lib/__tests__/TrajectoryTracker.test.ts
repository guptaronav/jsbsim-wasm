import { describe, it, expect, beforeEach } from "vitest";
import { TrajectoryTracker } from "../TrajectoryTracker";

describe("TrajectoryTracker", () => {
  let tracker: TrajectoryTracker;

  beforeEach(() => {
    tracker = new TrajectoryTracker(100);
  });

  it("should start empty", () => {
    expect(tracker.getPointCount()).toBe(0);
    expect(tracker.getPoints()).toHaveLength(0);
  });

  it("should accumulate points", () => {
    tracker.addPoint({ x: -105.0, y: 40.0, z: 100 });
    tracker.addPoint({ x: -105.0, y: 40.0, z: 200 });
    tracker.addPoint({ x: -105.0, y: 40.0, z: 300 });

    expect(tracker.getPointCount()).toBe(3);
  });

  it("should return correct statistics for single point", () => {
    tracker.addPoint({ x: -105.0, y: 40.0, z: 500, speed: 100, verticalVelocity: 50 });

    const stats = tracker.getStatistics();
    expect(stats.maxAltitude).toBe(500);
    expect(stats.minAltitude).toBe(500);
    expect(stats.maxSpeed).toBe(100);
    expect(stats.maxVerticalVelocity).toBe(50);
    expect(stats.pointCount).toBe(1);
  });

  it("should track max altitude correctly", () => {
    tracker.addPoint({ x: 0, y: 0, z: 100 });
    tracker.addPoint({ x: 0, y: 0, z: 5000 });
    tracker.addPoint({ x: 0, y: 0, z: 3000 });
    tracker.addPoint({ x: 0, y: 0, z: 0 });

    const stats = tracker.getStatistics();
    expect(stats.maxAltitude).toBe(5000);
    expect(stats.minAltitude).toBe(0);
  });

  it("should track max speed correctly", () => {
    tracker.addPoint({ x: 0, y: 0, z: 0, speed: 50 });
    tracker.addPoint({ x: 0, y: 0, z: 100, speed: 250 });
    tracker.addPoint({ x: 0, y: 0, z: 50, speed: 100 });

    const stats = tracker.getStatistics();
    expect(stats.maxSpeed).toBe(250);
  });

  it("should evict oldest points when max is exceeded", () => {
    const smallTracker = new TrajectoryTracker(5);

    for (let i = 0; i < 8; i++) {
      smallTracker.addPoint({ x: i, y: i, z: i });
    }

    expect(smallTracker.getPointCount()).toBe(5);
    // Oldest 3 were evicted, first point should be x=3
    const points = smallTracker.getPoints();
    expect(points[0].x).toBe(3);
  });

  it("should downsample large trajectories", () => {
    for (let i = 0; i < 1000; i++) {
      tracker.addPoint({ x: i * 0.001, y: i * 0.001, z: i });
    }

    // Since max is 100, tracker will have only 100 points (eviction)
    const allPoints = tracker.getDownsampledPoints(50);
    expect(allPoints.length).toBeLessThanOrEqual(50);
  });

  it("should compute zero range for stationary rocket", () => {
    tracker.addPoint({ x: -105.0, y: 40.0, z: 0 });
    tracker.addPoint({ x: -105.0, y: 40.0, z: 1000 });
    tracker.addPoint({ x: -105.0, y: 40.0, z: 0 });

    const stats = tracker.getStatistics();
    expect(stats.range).toBeCloseTo(0, 3); // Within 0.001 km
  });

  it("should compute correct bounding box", () => {
    tracker.addPoint({ x: -105.0, y: 39.5, z: 0 });
    tracker.addPoint({ x: -105.5, y: 40.5, z: 1000 });
    tracker.addPoint({ x: -104.5, y: 40.0, z: 500 });

    const bounds = tracker.getBounds();
    expect(bounds.minLon).toBeCloseTo(-105.5);
    expect(bounds.maxLon).toBeCloseTo(-104.5);
    expect(bounds.minLat).toBeCloseTo(39.5);
    expect(bounds.maxLat).toBeCloseTo(40.5);
    expect(bounds.minAlt).toBe(0);
    expect(bounds.maxAlt).toBe(1000);
  });

  it("should return empty statistics when no points", () => {
    const stats = tracker.getStatistics();
    expect(stats.maxAltitude).toBe(0);
    expect(stats.minAltitude).toBe(0);
    expect(stats.range).toBe(0);
    expect(stats.pointCount).toBe(0);
  });

  it("should reset tracker completely", () => {
    tracker.addPoint({ x: 0, y: 0, z: 1000 });
    tracker.addPoint({ x: 0, y: 0, z: 2000 });

    tracker.reset();

    expect(tracker.getPointCount()).toBe(0);
    expect(tracker.getStatistics().maxAltitude).toBe(0);
  });

  it("should return empty bounds for no points", () => {
    const bounds = tracker.getBounds();
    expect(bounds.minLat).toBe(0);
    expect(bounds.maxLat).toBe(0);
    expect(bounds.minLon).toBe(0);
    expect(bounds.maxLon).toBe(0);
  });

  it("should track memory usage", () => {
    for (let i = 0; i < 10; i++) {
      tracker.addPoint({ x: 0, y: 0, z: i });
    }
    expect(tracker.getMemoryUsage()).toBe(10 * 40);
  });

  it("should handle negative vertical velocity in max calculation", () => {
    tracker.addPoint({ x: 0, y: 0, z: 1000, verticalVelocity: 200 });
    tracker.addPoint({ x: 0, y: 0, z: 500, verticalVelocity: -300 });

    const stats = tracker.getStatistics();
    expect(stats.maxVerticalVelocity).toBe(300); // Uses absolute value
  });
});
