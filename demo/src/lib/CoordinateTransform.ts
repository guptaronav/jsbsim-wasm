import type { Vector3 } from "../types";

/**
 * CoordinateTransform - Convert between geodetic and Cartesian coordinates
 * Handles WGS84 geodetic (lat/lon/alt) ↔ Local Tangent Plane (Cartesian)
 */

const WGS84_A = 6378137.0; // Semi-major axis (meters)
const WGS84_B = 6356752.314245; // Semi-minor axis (meters)
const WGS84_E2 = 1 - (WGS84_B * WGS84_B) / (WGS84_A * WGS84_A); // Eccentricity squared

export interface LocalOrigin {
  latitude: number;
  longitude: number;
  altitude: number; // meters
}

/**
 * Convert geodetic (lat/lon/alt) to ECEF (Earth-Centered Earth-Fixed) Cartesian
 */
export function geodeticToECEF(lat: number, lon: number, alt: number): Vector3 {
  const latRad = lat * (Math.PI / 180);
  const lonRad = lon * (Math.PI / 180);

  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.sin(latRad) * Math.sin(latRad));

  const x = (N + alt) * Math.cos(latRad) * Math.cos(lonRad);
  const y = (N + alt) * Math.cos(latRad) * Math.sin(lonRad);
  const z = (N * (1 - WGS84_E2) + alt) * Math.sin(latRad);

  return { x, y, z };
}

/**
 * Convert ECEF Cartesian to geodetic (lat/lon/alt)
 */
export function ecefToGeodetic(x: number, y: number, z: number): { lat: number; lon: number; alt: number } {
  const lon = Math.atan2(y, x) * (180 / Math.PI);

  const p = Math.sqrt(x * x + y * y);
  let lat = Math.atan2(z, p * (1 - WGS84_E2));

  // Iterative refinement for accuracy
  for (let i = 0; i < 3; i++) {
    const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.sin(lat) * Math.sin(lat));
    const newLat = Math.atan2(z + WGS84_E2 * N * Math.sin(lat), p);
    if (Math.abs(newLat - lat) < 1e-12) break;
    lat = newLat;
  }

  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.sin(lat) * Math.sin(lat));
  const alt = p / Math.cos(lat) - N;

  return { lat: lat * (180 / Math.PI), lon, alt };
}

/**
 * Create transformation matrices for local tangent plane
 * Converts ECEF to local East-North-Up (ENU) coordinates
 */
export function createLTPTransform(origin: LocalOrigin): {
  toLocal: (ecef: Vector3) => Vector3;
  toECEF: (local: Vector3) => Vector3;
} {
  const originECEF = geodeticToECEF(origin.latitude, origin.longitude, origin.altitude);

  const latRad = origin.latitude * (Math.PI / 180);
  const lonRad = origin.longitude * (Math.PI / 180);

  // Rotation matrix: ECEF to ENU
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinLon = Math.sin(lonRad);
  const cosLon = Math.cos(lonRad);

  const toLocal = (ecef: Vector3): Vector3 => {
    const dx = ecef.x - originECEF.x;
    const dy = ecef.y - originECEF.y;
    const dz = ecef.z - originECEF.z;

    // ECEF to ENU rotation
    const east = -sinLon * dx + cosLon * dy;
    const north = -sinLat * cosLon * dx - sinLat * sinLon * dy + cosLat * dz;
    const up = cosLat * cosLon * dx + cosLat * sinLon * dy + sinLat * dz;

    return { x: east, y: north, z: up };
  };

  const toECEF = (local: Vector3): Vector3 => {
    const east = local.x;
    const north = local.y;
    const up = local.z;

    // ENU to ECEF rotation (inverse)
    const dx = -sinLon * east - sinLat * cosLon * north + cosLat * cosLon * up;
    const dy = cosLon * east - sinLat * sinLon * north + cosLat * sinLon * up;
    const dz = cosLat * north + sinLat * up;

    return {
      x: originECEF.x + dx,
      y: originECEF.y + dy,
      z: originECEF.z + dz,
    };
  };

  return { toLocal, toECEF };
}

/**
 * Simple local tangent plane approximation
 * Good for small areas (< 100 km)
 * Uses latitude as reference for scale
 */
export function geodeticToLocal(
  lat: number,
  lon: number,
  alt: number,
  refLat: number,
  refLon: number,
  refAlt: number
): Vector3 {
  // Earth radius (meters)
  const EARTH_RADIUS = 6371000;

  // Convert altitude from feet to meters
  const altMeters = alt * 0.3048;
  const refAltMeters = refAlt * 0.3048;

  // Local tangent plane approximation
  const latRad = lat * (Math.PI / 180);
  const refLatRad = refLat * (Math.PI / 180);

  const dLat = (lat - refLat) * (Math.PI / 180);
  const dLon = (lon - refLon) * (Math.PI / 180);

  // X (East): longitude difference scaled by latitude
  const x = dLon * EARTH_RADIUS * Math.cos(refLatRad);

  // Y (North): latitude difference
  const y = dLat * EARTH_RADIUS;

  // Z (Up): altitude difference
  const z = altMeters - refAltMeters;

  return { x, y, z };
}

/**
 * Reverse: local coordinates back to geodetic
 */
export function localToGeodetic(
  x: number,
  y: number,
  z: number,
  refLat: number,
  refLon: number,
  refAlt: number
): { lat: number; lon: number; alt: number } {
  const EARTH_RADIUS = 6371000;

  const refLatRad = refLat * (Math.PI / 180);

  // Reverse the local tangent plane approximation
  const dLat = y / EARTH_RADIUS;
  const dLon = x / (EARTH_RADIUS * Math.cos(refLatRad));

  const lat = refLat + dLat * (180 / Math.PI);
  const lon = refLon + dLon * (180 / Math.PI);
  const alt = refAlt + z / 0.3048; // Convert back to feet

  return { lat, lon, alt };
}
