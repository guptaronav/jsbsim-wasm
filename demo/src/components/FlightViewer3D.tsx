/**
 * FlightViewer3D - 3D flight visualization with Three.js
 * Renders aircraft model with position/rotation updates, trajectory, and camera controls
 */

import { useEffect, useRef } from "react";
import type { AircraftState, Vector3 } from "../types";
import { geodeticToLocal } from "../lib/CoordinateTransform";

interface FlightViewer3DProps {
  aircraftState: AircraftState;
  trajectoryPoints: Vector3[];
  referenceLatitude: number;
  referenceLongitude: number;
  referenceAltitude: number;
  isRunning: boolean;
}

// Lazy-load Three.js to avoid bundle bloat
let THREE: any = null;

async function loadThree() {
  if (!THREE) {
    const module = await import("three");
    THREE = module;
  }
  return THREE;
}

export default function FlightViewer3D({
  aircraftState,
  trajectoryPoints,
  referenceLatitude,
  referenceLongitude,
  referenceAltitude,
  isRunning,
}: FlightViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const aircraftRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const trajectoryLineRef = useRef<any>(null);

  useEffect(() => {
    let animationId: number;
    let scene: any, renderer: any, camera: any;

    const initScene = async () => {
      const THREE = await loadThree();

      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // Scene setup
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      scene.fog = new THREE.Fog(0x1a1a2e, 5000, 10000);

      // Camera
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100000);
      camera.position.set(100, 100, 100);
      camera.lookAt(0, 0, 0);

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      containerRef.current.appendChild(renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(500, 500, 500);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Ground plane
      const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d3e50,
        roughness: 0.8,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Grid helper
      const gridHelper = new THREE.GridHelper(2000, 20, 0x444444, 0x222222);
      scene.add(gridHelper);

      // Axes helper
      const axesHelper = new THREE.AxesHelper(100);
      scene.add(axesHelper);

      // Aircraft model (simple box for now)
      const aircraftGeometry = new THREE.BoxGeometry(10, 8, 20);
      const aircraftMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        metalness: 0.6,
        roughness: 0.4,
      });
      const aircraft = new THREE.Mesh(aircraftGeometry, aircraftMaterial);
      aircraft.castShadow = true;
      aircraft.receiveShadow = true;
      scene.add(aircraft);

      // Trajectory line
      const trajectoryMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 2,
      });
      const trajectoryGeometry = new THREE.BufferGeometry();
      const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
      scene.add(trajectoryLine);

      // Store references
      sceneRef.current = scene;
      rendererRef.current = renderer;
      aircraftRef.current = aircraft;
      cameraRef.current = camera;
      trajectoryLineRef.current = trajectoryLine;

      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current) return;
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      window.addEventListener("resize", handleResize);

      // Animation loop
      const animate = () => {
        animationId = requestAnimationFrame(animate);

        // Update aircraft position and rotation
        const localPos = geodeticToLocal(
          aircraftState.latitude,
          aircraftState.longitude,
          aircraftState.altitude,
          referenceLatitude,
          referenceLongitude,
          referenceAltitude
        );

        aircraft.position.set(localPos.x, localPos.z, localPos.y);
        aircraft.rotation.order = "YXZ";
        aircraft.rotation.y = aircraftState.attitude.yaw;
        aircraft.rotation.x = aircraftState.attitude.pitch;
        aircraft.rotation.z = aircraftState.attitude.roll;

        // Update trajectory line
        if (trajectoryPoints.length > 1) {
          const positions = new Float32Array(trajectoryPoints.length * 3);
          for (let i = 0; i < trajectoryPoints.length; i++) {
            const point = trajectoryPoints[i];
            const local = geodeticToLocal(
              point.y,
              point.x,
              point.z,
              referenceLatitude,
              referenceLongitude,
              referenceAltitude
            );
            positions[i * 3] = local.x;
            positions[i * 3 + 1] = local.z;
            positions[i * 3 + 2] = local.y;
          }
          trajectoryLine.geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
          );
        }

        // Update camera (follow + orbit)
        if (isRunning) {
          const distance = 100;
          const angle = Date.now() * 0.0005;
          camera.position.x = aircraft.position.x + Math.cos(angle) * distance;
          camera.position.y = aircraft.position.y + 50;
          camera.position.z = aircraft.position.z + Math.sin(angle) * distance;
          camera.lookAt(aircraft.position);
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

    initScene().catch(console.error);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="flight-viewer-3d">
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />
      {/* HUD Overlay */}
      <div className="hud-overlay">
        <div className="hud-item">
          <span className="hud-label">ALT</span>
          <span className="hud-value">{aircraftState.altitude.toFixed(0)} ft</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">SPD</span>
          <span className="hud-value">{aircraftState.airspeed.toFixed(1)} ft/s</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">HDG</span>
          <span className="hud-value">
            {(aircraftState.attitude.yaw * (180 / Math.PI)).toFixed(0)}°
          </span>
        </div>
        <div className="hud-item">
          <span className="hud-label">PITCH</span>
          <span className="hud-value">
            {(aircraftState.attitude.pitch * (180 / Math.PI)).toFixed(1)}°
          </span>
        </div>
      </div>
    </div>
  );
}
