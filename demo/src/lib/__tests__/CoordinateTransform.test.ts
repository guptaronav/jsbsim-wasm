import { describe, it, expect } from "vitest";
import {
  geodeticToECEF,
  ecefToGeodetic,
  geodeticToLocal,
  localToGeodetic,
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
