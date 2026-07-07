import { useCallback, useEffect, useState } from "react";

function loadStored(storageKey: string, defaults: readonly string[]): string[] {
  if (typeof window === "undefined") return [...defaults];
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [...defaults];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.every((v) => typeof v === "string") ? parsed : [...defaults];
  } catch {
    return [...defaults];
  }
}

export interface ChannelListConfig {
  channels: string[];
  setChannel: (index: number, channelId: string) => void;
  addChannel: (channelId: string) => void;
  removeChannel: (index: number) => void;
}

/**
 * Persists a user-configurable, ordered list of channel ids (used by both
 * the metric tile bar and the chart's series legend) to localStorage.
 */
export function useChannelListConfig(storageKey: string, defaults: readonly string[]): ChannelListConfig {
  const [channels, setChannels] = useState<string[]>(() => loadStored(storageKey, defaults));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(channels));
    } catch {
      // Storage may be unavailable (private browsing); config just won't persist.
    }
  }, [storageKey, channels]);

  const setChannel = useCallback((index: number, channelId: string): void => {
    setChannels((prev) => prev.map((c, i) => (i === index ? channelId : c)));
  }, []);

  const addChannel = useCallback((channelId: string): void => {
    setChannels((prev) => [...prev, channelId]);
  }, []);

  const removeChannel = useCallback((index: number): void => {
    setChannels((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return { channels, setChannel, addChannel, removeChannel };
}
