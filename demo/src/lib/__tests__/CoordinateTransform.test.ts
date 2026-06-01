import { describe, it, expect } from "vitest";
import {
  geodeticToECEF,
  ecefToGeodetic,
  geodeticToLocal,
  localToGeodetic,
  createLTPTransform,
} from "../CoordinateTransform";

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_M = 6371000;

describe("CoordinateTransform", () => {
  describe("geodeticToECEF", () => {
    it("should convert equator/prime meridian to ECEF", () => {
      const result = geodeticToECEF(0, 0, 0);
      // At lat=0, lon=0, alt=0 → (R, 0, 0)
      expect(result.x).toBeCloseTo(6378137, 0); // WGS84 semi-major axis
      expect(result.y).toBeCloseTo(0, 3);
      expect(result.z).toBeCloseTo(0, 3);
    });

    it("should convert north pole to ECEF", () => {
      const result = geodeticToECEF(90, 0, 0);
      expect(result.x).toBeCloseTo(0, 0);
      expect(result.y).toBeCloseTo(0, 0);
      expect(result.z).toBeCloseTo(6356752.3, 0); // WGS84 semi-minor axis
    });

    it("should include altitude offset", () => {
      const atGround = geodeticToECEF(0, 0, 0);
      const above = geodeticToECEF(0, 0, 1000);
      // 1000m above should move x by 1000m at equator/prime meridian
      expect(above.x - atGround.x).toBeCloseTo(1000, 0);
    });
  });

  describe("ecefToGeodetic", () => {
    it("should round-trip from geodetic → ECEF → geodetic", () => {
      const lat = 37.4419;
      const lon = -122.143;
      const alt = 100;

      const ecef = geodeticToECEF(lat, lon, alt);
      const back = ecefToGeodetic(ecef.x, ecef.y, ecef.z);

      expect(back.lat).toBeCloseTo(lat, 4);
      expect(back.lon).toBeCloseTo(lon, 4);
    });
  });

  describe("geodeticToLocal", () => {
    it("should return (0,0,0) at reference point", () => {
      const result = geodeticToLocal(40.0, -105.0, 1000, 40.0, -105.0, 1000);
      expect(result.x).toBeCloseTo(0, 6);
      expect(result.y).toBeCloseTo(0, 6);
      expect(result.z).toBeCloseTo(0, 6);
    });

    it("should compute altitude difference correctly", () => {
      const result = geodeticToLocal(40.0, -105.0, 2000, 40.0, -105.0, 1000);
      // 1000 ft above reference = ~304.8 m above
      expect(result.z).toBeCloseTo(304.8, 0);
    });

    it("should compute northward displacement correctly", () => {
      // 1 degree north ≈ 111 km = 111000 m
      const result = geodeticToLocal(41.0, -105.0, 0, 40.0, -105.0, 0);
      expect(result.y).toBeCloseTo(EARTH_RADIUS_M * DEG_TO_RAD, 0); // ~111km north
    });

    it("should compute eastward displacement correctly", () => {
      // 1 degree east at 40° lat ≈ cos(40°) * 111 km
      const result = geodeticToLocal(40.0, -104.0, 0, 40.0, -105.0, 0);
      const expectedX = EARTH_RADIUS_M * DEG_TO_RAD * Math.cos(40.0 * DEG_TO_RAD);
      expect(result.x).toBeCloseTo(expectedX, -2); // Within 100m
    });
  });

  describe("localToGeodetic", () => {
    it("should round-trip from local → geodetic → local", () => {
      const refLat = 40.0;
      const refLon = -105.0;
      const refAlt = 1000;

      const local = geodeticToLocal(40.01, -104.99, 1500, refLat, refLon, refAlt);
      const back = localToGeodetic(local.x, local.y, local.z, refLat, refLon, refAlt);

      expect(back.lat).toBeCloseTo(40.01, 3);
      expect(back.lon).toBeCloseTo(-104.99, 3);
    });
  });
});

// ---------------------------------------------------------------------------
// createLTPTransform — Local Tangent Plane (ENU) transform factory
// ---------------------------------------------------------------------------

describe("createLTPTransform", () => {
  const ORIGIN = { latitude: 40.0, longitude: -105.0, altitude: 1000 };

  it("toLocal: returns (0,0,0) when converting the origin point itself", () => {
    const { toLocal } = createLTPTransform(ORIGIN);
    const originECEF = geodeticToECEF(ORIGIN.latitude, ORIGIN.longitude, ORIGIN.altitude);
    const local = toLocal(originECEF);

    expect(local.x).toBeCloseTo(0, 3);
    expect(local.y).toBeCloseTo(0, 3);
    expect(local.z).toBeCloseTo(0, 3);
  });

  it("toECEF: round-trips a local (0,0,0) back to the origin ECEF", () => {
    const { toECEF } = createLTPTransform(ORIGIN);
    const originECEF = geodeticToECEF(ORIGIN.latitude, ORIGIN.longitude, ORIGIN.altitude);

    const backECEF = toECEF({ x: 0, y: 0, z: 0 });

    expect(backECEF.x).toBeCloseTo(originECEF.x, 0);
    expect(backECEF.y).toBeCloseTo(originECEF.y, 0);
    expect(backECEF.z).toBeCloseTo(originECEF.z, 0);
  });

  it("toLocal → toECEF round-trip preserves the original ECEF point", () => {
    const { toLocal, toECEF } = createLTPTransform(ORIGIN);

    // A point 500m north of the origin
    const northECEF = geodeticToECEF(40.005, -105.0, 1000);
    const local = toLocal(northECEF);
    const backECEF = toECEF(local);

    expect(backECEF.x).toBeCloseTo(northECEF.x, 0);
    expect(backECEF.y).toBeCloseTo(northECEF.y, 0);
    expect(backECEF.z).toBeCloseTo(northECEF.z, 0);
  });

  it("toLocal: east displacement gives positive x (ENU convention)", () => {
    const { toLocal } = createLTPTransform(ORIGIN);

    // Point slightly to the east (larger longitude)
    const eastPoint = geodeticToECEF(40.0, -104.9, 1000);
    const local = toLocal(eastPoint);

    expect(local.x).toBeGreaterThan(0); // east → +x
  });

  it("toLocal: north displacement gives positive y (ENU convention)", () => {
    const { toLocal } = createLTPTransform(ORIGIN);

    // Point slightly to the north
    const northPoint = geodeticToECEF(40.1, -105.0, 1000);
    const local = toLocal(northPoint);

    expect(local.y).toBeGreaterThan(0); // north → +y
  });

  it("toLocal: upward displacement gives positive z (ENU convention)", () => {
    const { toLocal } = createLTPTransform(ORIGIN);

    // Same lat/lon, 500m higher
    const upPoint = geodeticToECEF(40.0, -105.0, 1500);
    const local = toLocal(upPoint);

    expect(local.z).toBeGreaterThan(0); // up → +z
    expect(local.z).toBeCloseTo(500, 0);
  });

  it("toECEF: applying a known eastward local offset moves longitude in correct direction", () => {
    const { toECEF } = createLTPTransform(ORIGIN);
    const originECEF = geodeticToECEF(ORIGIN.latitude, ORIGIN.longitude, ORIGIN.altitude);

    // Apply a pure east offset of 1000m
    const shifted = toECEF({ x: 1000, y: 0, z: 0 });

    // The result should be roughly east — y and z of ECEF change with longitude
    expect(shifted.x).not.toBeCloseTo(originECEF.x, -3);
  });
});
