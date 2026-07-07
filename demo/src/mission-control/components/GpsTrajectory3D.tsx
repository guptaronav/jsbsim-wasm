/**
 * GpsTrajectory3D - 3D East-North-Up trajectory plot.
 * Mirrors FlightViewer3D's lazy-load-three pattern; reuses geodeticToLocal
 * (already ENU: x=east, y=north, z=up) so no new coordinate math is needed.
 */
import { useEffect, useRef } from "react";
import { geodeticToLocal } from "../../lib/CoordinateTransform";
import type { Vector3 } from "../../types";

interface GpsTrajectory3DProps {
  trajectoryPoints: Vector3[];
  referenceLatitude: number;
  referenceLongitude: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let THREE: any = null;

async function loadThree() {
  if (!THREE) {
    THREE = await import("three");
  }
  return THREE;
}

const AXIS_LENGTH = 400;

export default function GpsTrajectory3D({
  trajectoryPoints,
  referenceLatitude,
  referenceLongitude,
}: GpsTrajectory3DProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trajectoryLineRef = useRef<any>(null);

  useEffect(() => {
    let animationId: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scene: any, renderer: any, camera: any;

    const init = async () => {
      const THREE = await loadThree();
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0d12);

      camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 50000);
      camera.position.set(AXIS_LENGTH * 1.2, AXIS_LENGTH * 1.0, AXIS_LENGTH * 1.2);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current.appendChild(renderer.domElement);

      // ENU axes: X=east (red), Z=north (blue), Y=up (green)
      const axesMaterefs: Array<[number, number, number, number]> = [
        [AXIS_LENGTH, 0, 0, 0xff5c5c],
        [0, AXIS_LENGTH, 0, 0x4ade80],
        [0, 0, AXIS_LENGTH, 0x38bdf8],
      ];
      for (const [x, y, z, color] of axesMaterefs) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(x, y, z),
        ]);
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }));
        scene.add(line);
      }

      const grid = new THREE.GridHelper(AXIS_LENGTH * 2, 10, 0x232a35, 0x171c25);
      scene.add(grid);

      const trajectoryLine = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xf59e0b })
      );
      scene.add(trajectoryLine);
      trajectoryLineRef.current = trajectoryLine;

      const handleResize = () => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", handleResize);

      const animate = () => {
        animationId = requestAnimationFrame(animate);

        if (trajectoryPoints.length > 1) {
          const positions = new Float32Array(trajectoryPoints.length * 3);
          trajectoryPoints.forEach((point, i) => {
            const local = geodeticToLocal(
              point.y,
              point.x,
              point.z,
              referenceLatitude,
              referenceLongitude,
              0
            );
            // local = {x: east, y: north, z: up} -> three.js (east, up, north)
            positions[i * 3] = local.x;
            positions[i * 3 + 1] = local.z;
            positions[i * 3 + 2] = local.y;
          });
          trajectoryLine.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          trajectoryLine.geometry.computeBoundingSphere();
        }

        renderer.render(scene, camera);
      };
      animate();

      return () => {
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(animationId);
        renderer.dispose();
        if (containerRef.current?.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
      };
    };

    void init();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceLatitude, referenceLongitude]);

  const last = trajectoryPoints[trajectoryPoints.length - 1];
  const localLast = last
    ? geodeticToLocal(last.y, last.x, last.z, referenceLatitude, referenceLongitude, 0)
    : null;

  return (
    <div className="mc-gps-3d">
      <div ref={containerRef} className="mc-gps-3d-canvas" />
      <div className="mc-gps-readout">
        <span>pts: {trajectoryPoints.length}</span>
        <span>x east: {localLast ? localLast.x.toFixed(1) : "—"} m</span>
        <span>y up: {localLast ? localLast.z.toFixed(1) : "—"} m</span>
        <span>z north: {localLast ? localLast.y.toFixed(1) : "—"} m</span>
      </div>
    </div>
  );
}
