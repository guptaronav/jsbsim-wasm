/**
 * TrajectoryDisplay - 2D top-down visualization of flight path
 * Renders trajectory points on canvas with current position marker
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { TrajectoryPoint } from "../lib/TrajectoryTracker";

interface TrajectoryDisplayProps {
  points: TrajectoryPoint[];
  currentPosition?: TrajectoryPoint;
  isDarkMode?: boolean;
}

function drawCanvas(
  canvas: HTMLCanvasElement,
  points: TrajectoryPoint[],
  currentPosition: TrajectoryPoint | undefined,
  isDarkMode: boolean
) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bgColor = isDarkMode ? "#1a1a2e" : "#f0f4f8";
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  if (points.length === 0) {
    ctx.fillStyle = isDarkMode ? "#4b5563" : "#9ca3af";
    ctx.font = `${Math.max(11, width / 30)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("No trajectory data", width / 2, height / 2);
    ctx.textAlign = "left";
    return;
  }

  let minLon = points[0].x, maxLon = points[0].x;
  let minLat = points[0].y, maxLat = points[0].y;

  for (const p of points) {
    minLon = Math.min(minLon, p.x);
    maxLon = Math.max(maxLon, p.x);
    minLat = Math.min(minLat, p.y);
    maxLat = Math.max(maxLat, p.y);
  }

  const lonRange = maxLon - minLon || 0.001;
  const latRange = maxLat - minLat || 0.001;
  const lonPad = lonRange * 0.15;
  const latPad = latRange * 0.15;
  minLon -= lonPad; maxLon += lonPad;
  minLat -= latPad; maxLat += latPad;

  const scaleX = width / (maxLon - minLon);
  const scaleY = height / (maxLat - minLat);
  const toX = (lon: number) => (lon - minLon) * scaleX;
  const toY = (lat: number) => height - (lat - minLat) * scaleY;

  // Grid
  ctx.strokeStyle = isDarkMode ? "#252540" : "#d1d5db";
  ctx.lineWidth = 1;
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const x = (width / gridCount) * i;
    const y = (height / gridCount) * i;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Trajectory path
  ctx.strokeStyle = isDarkMode ? "#ef4444" : "#dc2626";
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    if (i === 0) ctx.moveTo(toX(points[i].x), toY(points[i].y));
    else ctx.lineTo(toX(points[i].x), toY(points[i].y));
  }
  ctx.stroke();

  // Start marker (green)
  const sx = toX(points[0].x), sy = toY(points[0].y);
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(sx, sy, Math.max(4, width / 80), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Current position (blue)
  const current = currentPosition ?? points[points.length - 1];
  const cx = toX(current.x), cy = toY(current.y);
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(3, width / 100), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Direction arrow
  if (points.length > 1) {
    const prev = points[points.length - 2];
    const angle = Math.atan2(cy - toY(prev.y), cx - toX(prev.x));
    const arrowLen = Math.max(6, width / 60);
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - arrowLen * Math.cos(angle), cy - arrowLen * Math.sin(angle));
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }
}

export default function TrajectoryDisplay({
  points,
  currentPosition,
  isDarkMode = false,
}: TrajectoryDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 300, h: 200 });

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCanvas(canvas, points, currentPosition, isDarkMode);
  }, [points, currentPosition, isDarkMode]);

  // Responsive sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const w = Math.max(200, Math.floor(width));
      const h = Math.max(150, Math.floor(w * 0.6));
      setSize({ w, h });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Draw whenever data or size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size.w;
    canvas.height = size.h;
    redraw();
  }, [size, redraw]);

  return (
    <div className="trajectory-display" ref={containerRef}>
      <h3 className="panel-title">GPS Trajectory</h3>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", borderRadius: "6px" }}
      />
    </div>
  );
}
