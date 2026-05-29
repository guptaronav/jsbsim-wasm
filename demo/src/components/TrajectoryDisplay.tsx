/**
 * TrajectoryDisplay - 2D top-down visualization of flight path
 * Renders trajectory points on canvas with current position marker
 */

import { useEffect, useRef } from "react";
import type { TrajectoryPoint } from "../lib/TrajectoryTracker";

interface TrajectoryDisplayProps {
  points: TrajectoryPoint[]; // Trajectory points [lon, lat, alt, ...]
  currentPosition?: TrajectoryPoint; // Current aircraft position
  width?: number;
  height?: number;
  isDarkMode?: boolean;
}

export default function TrajectoryDisplay({
  points,
  currentPosition,
  width = 400,
  height = 400,
  isDarkMode = false,
}: TrajectoryDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    const bgColor = isDarkMode ? "#1a1a1a" : "#f5f5f5";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate bounds with padding
    let minLon = points[0].x;
    let maxLon = points[0].x;
    let minLat = points[0].y;
    let maxLat = points[0].y;

    for (const point of points) {
      minLon = Math.min(minLon, point.x);
      maxLon = Math.max(maxLon, point.x);
      minLat = Math.min(minLat, point.y);
      maxLat = Math.max(maxLat, point.y);
    }

    // Add 10% padding
    const lonRange = maxLon - minLon || 1;
    const latRange = maxLat - minLat || 1;
    const lonPad = lonRange * 0.1;
    const latPad = latRange * 0.1;

    minLon -= lonPad;
    maxLon += lonPad;
    minLat -= latPad;
    maxLat += latPad;

    // Scale factors
    const scaleX = width / (maxLon - minLon);
    const scaleY = height / (maxLat - minLat);

    // Helper to convert lat/lon to canvas coordinates
    const toCanvasX = (lon: number) => (lon - minLon) * scaleX;
    const toCanvasY = (lat: number) => height - (lat - minLat) * scaleY;

    // Draw grid
    ctx.strokeStyle = isDarkMode ? "#333" : "#ddd";
    ctx.lineWidth = 1;
    const gridSpacing = 10; // Approximate degrees
    for (let lon = Math.ceil(minLon); lon < maxLon; lon += gridSpacing) {
      const x = toCanvasX(lon);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let lat = Math.ceil(minLat); lat < maxLat; lat += gridSpacing) {
      const y = toCanvasY(lat);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw trajectory path
    ctx.strokeStyle = "#ef4444"; // Red path
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();

    for (let i = 0; i < points.length; i++) {
      const x = toCanvasX(points[i].x);
      const y = toCanvasY(points[i].y);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw start marker (green)
    const startX = toCanvasX(points[0].x);
    const startY = toCanvasY(points[0].y);
    ctx.fillStyle = "#22c55e"; // Green
    ctx.beginPath();
    ctx.arc(startX, startY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw current position marker (blue)
    if (currentPosition || points.length > 0) {
      const current = currentPosition || points[points.length - 1];
      const currentX = toCanvasX(current.x);
      const currentY = toCanvasY(current.y);
      ctx.fillStyle = "#3b82f6"; // Blue
      ctx.beginPath();
      ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw direction indicator
      if (points.length > 1) {
        const prev = points[points.length - 2];
        const prevX = toCanvasX(prev.x);
        const prevY = toCanvasY(prev.y);
        const dx = currentX - prevX;
        const dy = currentY - prevY;
        const angle = Math.atan2(dy, dx);
        const arrowSize = 8;

        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
          currentX - arrowSize * Math.cos(angle),
          currentY - arrowSize * Math.sin(angle)
        );
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
      }
    }

    // Draw legend
    const legendX = 10;
    const legendY = 10;
    const legendLineHeight = 16;

    ctx.font = "12px monospace";
    ctx.fillStyle = isDarkMode ? "#ccc" : "#333";

    // Green start marker
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(legendX, legendY, 8, 8);
    ctx.fillStyle = isDarkMode ? "#ccc" : "#333";
    ctx.fillText("Start", legendX + 12, legendY + 8);

    // Blue current marker
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(legendX, legendY + legendLineHeight, 8, 8);
    ctx.fillStyle = isDarkMode ? "#ccc" : "#333";
    ctx.fillText("Current", legendX + 12, legendY + legendLineHeight + 8);

    // Red path
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + legendLineHeight * 2 + 4);
    ctx.lineTo(legendX + 8, legendY + legendLineHeight * 2 + 4);
    ctx.stroke();
    ctx.fillStyle = isDarkMode ? "#ccc" : "#333";
    ctx.fillText("Path", legendX + 12, legendY + legendLineHeight * 2 + 8);
  }, [points, currentPosition, width, height, isDarkMode]);

  return (
    <div className="trajectory-display">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: `1px solid ${isDarkMode ? "#333" : "#ddd"}`,
          borderRadius: "8px",
          backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
        }}
      />
    </div>
  );
}
