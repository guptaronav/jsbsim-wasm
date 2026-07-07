import { useCallback, useEffect, useState } from "react";
import type { TelemetrySample } from "../../types";

const STEP_MS = 100;

export interface TimelineState {
  isReplaying: boolean;
  scrubTime: number;
  isPlaying: boolean;
  speed: number;
  minTime: number;
  maxTime: number;
}

export interface TimelineActions {
  enterReplay: () => void;
  goLive: () => void;
  scrubTo: (t: number) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
}

/** Drives replay/scrub state over an append-only sample log. */
export function useTimeline(samples: readonly TelemetrySample[]): TimelineState & TimelineActions {
  const [isReplaying, setIsReplaying] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const minTime = samples[0]?.time ?? 0;
  const maxTime = samples[samples.length - 1]?.time ?? 0;

  useEffect(() => {
    if (!isPlaying || !isReplaying) return;
    const timer = window.setInterval(() => {
      setScrubTime((t) => {
        const next = t + (STEP_MS / 1000) * speed;
        if (next >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return next;
      });
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [isPlaying, isReplaying, speed, maxTime]);

  const enterReplay = useCallback((): void => {
    setIsReplaying(true);
    setScrubTime(maxTime);
  }, [maxTime]);

  const goLive = useCallback((): void => {
    setIsReplaying(false);
    setIsPlaying(false);
  }, []);

  const scrubTo = useCallback(
    (t: number): void => {
      setScrubTime(Math.min(maxTime, Math.max(minTime, t)));
    },
    [minTime, maxTime]
  );

  const togglePlay = useCallback((): void => {
    setIsPlaying((p) => !p);
  }, []);

  return {
    isReplaying,
    scrubTime,
    isPlaying,
    speed,
    minTime,
    maxTime,
    enterReplay,
    goLive,
    scrubTo,
    togglePlay,
    setSpeed,
  };
}
