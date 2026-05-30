import type { Vector3 } from "../types";

export interface FlightStatistics {
  maxAltitude: number;
  minAltitude: number;
  maxSpeed: number;
  maxVerticalVelocity: number;
  flightTime: number;
  maxG: number;
  range: number; // Horizontal distance in km
  pointCount: number;
}

export interface TrajectoryPoint extends Vector3 {
  speed?: number;
  verticalVelocity?: number;
  /** Resultant acceleration in ft/s² (used for G-force calculation) */
  acceleration?: number;
  timestamp?: number;
}

/**
 * TrajectoryTracker - Accumulates flight path data and computes statistics
 * Tracks lat/lon/alt and optional performance metrics
 * Manages memory with configurable max point limit (FIFO eviction)
 */
export class TrajectoryTracker {
  private points: TrajectoryPoint[] = [];
  private maxPoints: number;
  private startLat: number = 0;
  private startLon: number = 0;
  private startTime: number = 0;

  constructor(maxPoints: number = 10000) {
    this.maxPoints = maxPoints;
  }

  /**
   * Add a point to the trajectory
   * @param point - Trajectory point (lon, lat, alt in feet)
   */
  public addPoint(point: TrajectoryPoint): void {
    if (this.points.length === 0) {
      this.startLat = point.y;
      this.startLon = point.x;
      this.startTime = point.timestamp || Date.now();
    }

    this.points.push(point);

    // Enforce max points with FIFO eviction
    if (this.points.length > this.maxPoints) {
      this.points.shift();
    }
  }

  /**
   * Get all trajectory points
   */
  public getPoints(): TrajectoryPoint[] {
    return [...this.points];
  }

  /**
   * Get a subset of points for downsampling (for rendering efficiency)
   * @param targetCount - Target number of points to return
   */
  public getDownsampledPoints(targetCount: number = 1000): TrajectoryPoint[] {
    if (this.points.length <= targetCount) {
      return [...this.points];
    }

    const stride = Math.ceil(this.points.length / targetCount);
    const result: TrajectoryPoint[] = [];
    for (let i = 0; i < this.points.length; i += stride) {
      result.push(this.points[i]);
    }
    return result;
  }

  /**
   * Get flight statistics
   */
  public getStatistics(): FlightStatistics {
    if (this.points.length === 0) {
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

    const G_FPS2 = 32.174; // 1 g in ft/s²

    let maxAlt = this.points[0].z;
    let minAlt = this.points[0].z;
    let maxSpeed = 0;
    let maxVertVel = 0;
    let maxG = 0;

    for (const point of this.points) {
      maxAlt = Math.max(maxAlt, point.z);
      minAlt = Math.min(minAlt, point.z);
      if (point.speed !== undefined) {
        maxSpeed = Math.max(maxSpeed, point.speed);
      }
      if (point.verticalVelocity !== undefined) {
        maxVertVel = Math.max(maxVertVel, Math.abs(point.verticalVelocity));
      }
      if (point.acceleration !== undefined) {
        // Convert resultant acceleration to g-units
        maxG = Math.max(maxG, Math.abs(point.acceleration) / G_FPS2);
      }
    }

    // Calculate range (horizontal distance from start to current position)
    const lastPoint = this.points[this.points.length - 1];
    const range = this.calculateDistance(this.startLat, this.startLon, lastPoint.y, lastPoint.x);

    // Calculate flight time in seconds
    const flightTime = this.startTime > 0 ? (Date.now() - this.startTime) / 1000 : 0;

    return {
      maxAltitude: maxAlt,
      minAltitude: minAlt,
      maxSpeed: maxSpeed,
      maxVerticalVelocity: maxVertVel,
      flightTime: flightTime,
      maxG,
      range: range,
      pointCount: this.points.length,
    };
  }

  /**
   * Reset tracker for a new flight
   */
  public reset(): void {
    this.points = [];
    this.startLat = 0;
    this.startLon = 0;
    this.startTime = 0;
  }

  /**
   * Get bounding box of trajectory
   */
  public getBounds(): {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
    minAlt: number;
    maxAlt: number;
  } {
    if (this.points.length === 0) {
      return {
        minLat: 0,
        maxLat: 0,
        minLon: 0,
        maxLon: 0,
        minAlt: 0,
        maxAlt: 0,
      };
    }

    let minLat = this.points[0].y;
    let maxLat = this.points[0].y;
    let minLon = this.points[0].x;
    let maxLon = this.points[0].x;
    let minAlt = this.points[0].z;
    let maxAlt = this.points[0].z;

    for (const point of this.points) {
      minLat = Math.min(minLat, point.y);
      maxLat = Math.max(maxLat, point.y);
      minLon = Math.min(minLon, point.x);
      maxLon = Math.max(maxLon, point.x);
      minAlt = Math.min(minAlt, point.z);
      maxAlt = Math.max(maxAlt, point.z);
    }

    return { minLat, maxLat, minLon, maxLon, minAlt, maxAlt };
  }

  /**
   * Calculate great-circle distance between two points (in km)
   * Using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get point count
   */
  public getPointCount(): number {
    return this.points.length;
  }

  /**
   * Get memory usage estimate in bytes
   */
  public getMemoryUsage(): number {
    // Rough estimate: ~40 bytes per point (3 numbers + optional fields)
    return this.points.length * 40;
  }
}
