import { useEffect, useRef } from "react";
import type { TelemetrySample, StageState } from "../types";

interface RocketCanvasProps {
  samples: TelemetrySample[];
  stageState: StageState;
  running: boolean;
}

const COLORS = {
  ground: "#2d4a3e",
  sky: "#0a1628",
  skyHigh: "#0d2137",
  altText: "#7eccc0",
  trajectory: "rgba(249,115,22,0.55)",
  trajectoryHead: "#f97316",
  rocket: "#e2e8f0",
  rocketNose: "#f97316",
  flame: "#f97316",
  flameInner: "#fbbf24",
  axis: "rgba(126,204,192,0.2)",
  axisLabel: "rgba(126,204,192,0.55)",
};

function drawRocket(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pitchRad: number,
  scale: number,
  showFlame: boolean,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  // JSBSim pitch: nose-up is positive, canvas Y is inverted
  ctx.rotate(-pitchRad);

  const h = 22 * scale;
  const w = 5 * scale;
  const noseH = 8 * scale;

  // Body
  ctx.fillStyle = COLORS.rocket;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = COLORS.rocketNose;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  ctx.lineTo(0, -h / 2 - noseH);
  ctx.closePath();
  ctx.fill();

  // Fins
  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  ctx.lineTo(-w / 2 - 6 * scale, h / 2 + 4 * scale);
  ctx.lineTo(-w / 2, h / 2 - 8 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w / 2, h / 2);
  ctx.lineTo(w / 2 + 6 * scale, h / 2 + 4 * scale);
  ctx.lineTo(w / 2, h / 2 - 8 * scale);
  ctx.closePath();
  ctx.fill();

  // Flame during boost
  if (showFlame) {
    const flameLen = (14 + Math.random() * 8) * scale;
    const grad = ctx.createLinearGradient(0, h / 2, 0, h / 2 + flameLen);
    grad.addColorStop(0, COLORS.flameInner);
    grad.addColorStop(0.4, COLORS.flame);
    grad.addColorStop(1, "rgba(249,115,22,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 2 * scale, h / 2);
    ctx.lineTo(w / 2 - 2 * scale, h / 2);
    ctx.lineTo(0, h / 2 + flameLen);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export default function RocketCanvas({ samples, stageState, running }: RocketCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      if (!canvas || !ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const padLeft = 52;
      const padRight = 16;
      const padTop = 20;
      const padBottom = 36;
      const plotW = W - padLeft - padRight;
      const plotH = H - padTop - padBottom;

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, COLORS.sky);
      bg.addColorStop(0.85, COLORS.skyHigh);
      bg.addColorStop(1, COLORS.ground);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      if (samples.length === 0) {
        ctx.fillStyle = COLORS.axisLabel;
        ctx.font = "13px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("Awaiting launch...", W / 2, H / 2);
        return;
      }

      const maxAlt = Math.max(...samples.map((s) => s.altitude), 100);
      const altScale = plotH / (maxAlt * 1.15);

      // Altitude grid lines
      const gridSteps = 5;
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.fillStyle = COLORS.axisLabel;
      ctx.textAlign = "right";

      for (let i = 0; i <= gridSteps; i++) {
        const altVal = (maxAlt * 1.15 * i) / gridSteps;
        const y = padTop + plotH - altVal * altScale;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();
        if (i > 0) ctx.fillText(`${Math.round(altVal)} ft`, padLeft - 4, y + 4);
      }
      ctx.setLineDash([]);

      // Ground line
      const groundY = padTop + plotH;
      ctx.strokeStyle = COLORS.ground;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padLeft, groundY);
      ctx.lineTo(padLeft + plotW, groundY);
      ctx.stroke();

      // Trajectory path — X-axis is time (or could be horizontal distance; rocket is vertical)
      const timeMin = samples[0].time;
      const timeMax = samples[samples.length - 1].time;
      const timeRange = Math.max(timeMax - timeMin, 1);
      const toX = (t: number) => padLeft + ((t - timeMin) / timeRange) * plotW;
      const toY = (alt: number) => padTop + plotH - alt * altScale;

      ctx.strokeStyle = COLORS.trajectory;
      ctx.lineWidth = 2;
      ctx.beginPath();
      samples.forEach((s, i) => {
        const x = toX(s.time);
        const y = toY(s.altitude);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Current position dot
      const last = samples[samples.length - 1];
      const rx = toX(last.time);
      const ry = toY(last.altitude);
      ctx.fillStyle = COLORS.trajectoryHead;
      ctx.beginPath();
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
      ctx.fill();

      // Rocket silhouette at current position
      const showFlame = stageState.launch && !stageState.burnout && running;
      drawRocket(ctx, rx, ry, last.pitchRad, 1, showFlame);

      // Stage markers (vertical lines at stage transition times)
      const stageColors: Record<string, string> = {
        burnout: "#fbbf24",
        apogee: "#7eccc0",
        landing: "#94a3b8",
      };
      for (const [stage, color] of Object.entries(stageColors)) {
        const t = (samples as TelemetrySample[]).find(
          (s) => s.time >= (last.time - 0.1) && stageState[stage as keyof StageState]
        );
        if (t) {
          const sx = toX(t.time);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(sx, padTop);
          ctx.lineTo(sx, groundY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Altitude callout
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 13px 'IBM Plex Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${Math.round(last.altitude)} ft`, padLeft + 6, padTop + 16);
    }

    function loop() {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [samples, stageState, running]);

  return (
    <canvas
      ref={canvasRef}
      width={420}
      height={280}
      style={{ width: "100%", height: "100%", display: "block", borderRadius: 8 }}
    />
  );
}
