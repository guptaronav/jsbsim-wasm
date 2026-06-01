import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import type { TelemetrySample } from "../types";
import "leaflet/dist/leaflet.css";

interface MapAutoFitProps {
  center: [number, number];
  hasLaunched: boolean;
}

function MapAutoFit({ center, hasLaunched }: MapAutoFitProps) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current && hasLaunched) {
      map.setView(center, 15);
      fitted.current = true;
    }
  }, [center, hasLaunched, map]);
  return null;
}

interface TrajectoryMapProps {
  samples: TelemetrySample[];
  launched: boolean;
}

export default function TrajectoryMap({ samples, launched }: TrajectoryMapProps) {
  const validSamples = samples.filter(
    (s) => Number.isFinite(s.latDeg) && Number.isFinite(s.lonDeg) && s.latDeg !== 0
  );

  const positions: [number, number][] = validSamples.map((s) => [s.latDeg, s.lonDeg]);
  const latest = validSamples.at(-1);
  const first = validSamples[0];

  const initialCenter: [number, number] = first
    ? [first.latDeg, first.lonDeg]
    : [47.0, 122.0];

  return (
    <div style={{ width: "100%", height: "100%", borderRadius: 8, overflow: "hidden", position: "relative" }}>
      {validSamples.length > 0 ? (
        <MapContainer
          key="map"
          center={initialCenter}
          zoom={15}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {positions.length >= 2 && (
            <Polyline
              positions={positions}
              pathOptions={{ color: "#f97316", weight: 2.5, opacity: 0.8 }}
            />
          )}

          {latest && (
            <CircleMarker
              center={[latest.latDeg, latest.lonDeg]}
              radius={6}
              pathOptions={{ color: "#f97316", fillColor: "#f97316", fillOpacity: 1, weight: 2 }}
            />
          )}

          {first && (
            <CircleMarker
              center={[first.latDeg, first.lonDeg]}
              radius={5}
              pathOptions={{ color: "#7eccc0", fillColor: "#7eccc0", fillOpacity: 0.7, weight: 2 }}
            />
          )}

          <MapAutoFit center={initialCenter} hasLaunched={launched} />
        </MapContainer>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(10,22,40,0.7)",
            color: "#7eccc0",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13,
            pointerEvents: "none",
            borderRadius: 8,
          }}
        >
          Awaiting GPS fix...
        </div>
      )}
    </div>
  );
}
