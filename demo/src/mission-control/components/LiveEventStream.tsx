import { useEffect, useMemo, useRef, useState } from "react";
import type { LiveEvent, LiveEventLevel } from "../lib/liveFeed";

interface LiveEventStreamProps {
  events: LiveEvent[];
}

const ROW_HEIGHT = 22;
const VIEWPORT_HEIGHT = 360;
const OVERSCAN = 6;

type LevelFilter = "all" | LiveEventLevel;

export default function LiveEventStream({ events }: LiveEventStreamProps): JSX.Element {
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [scrollTop, setScrollTop] = useState(0);
  const frozenRef = useRef<LiveEvent[]>(events);
  const viewportRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);

  useEffect(() => {
    if (!paused) frozenRef.current = events;
  }, [events, paused]);

  const source = paused ? frozenRef.current : events;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return source.filter((event) => {
      if (levelFilter !== "all" && event.level !== levelFilter) return false;
      if (!query) return true;
      return event.channel.toLowerCase().includes(query) || event.message.toLowerCase().includes(query);
    });
  }, [source, search, levelFilter]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || paused || !wasAtBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [filtered.length, paused]);

  const total = filtered.length;
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(total, startIndex + visibleCount);
  const visibleItems = filtered.slice(startIndex, endIndex);
  const topSpacer = startIndex * ROW_HEIGHT;
  const bottomSpacer = (total - endIndex) * ROW_HEIGHT;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>): void => {
    const el = e.currentTarget;
    setScrollTop(el.scrollTop);
    wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < ROW_HEIGHT * 2;
  };

  return (
    <section className="mc-panel mc-live-events" aria-label="Live event stream">
      <div className="mc-live-events-toolbar">
        <h2 className="mc-panel-title">Live Events</h2>
        <label className="visually-hidden" htmlFor="mc-event-search">
          Search events
        </label>
        <input
          id="mc-event-search"
          type="search"
          className="mc-event-search"
          placeholder="Search channel or message…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="visually-hidden" htmlFor="mc-event-level">
          Filter by level
        </label>
        <select
          id="mc-event-level"
          className="mc-event-level"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
        >
          <option value="all">All levels</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
        <button
          type="button"
          className={`mc-btn mc-btn--ghost ${paused ? "mc-btn--active" : ""}`}
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      <div
        className="mc-event-viewport"
        ref={viewportRef}
        onScroll={handleScroll}
        style={{ height: VIEWPORT_HEIGHT }}
      >
        <div style={{ height: topSpacer }} />
        {visibleItems.map((event) => (
          <div className={`mc-event-row mc-event-row--${event.level}`} key={event.id} style={{ height: ROW_HEIGHT }}>
            <span className="mc-event-channel">{event.channel}</span>
            <span className="mc-event-time">t={event.simTime.toFixed(2)}</span>
            <span className="mc-event-seq">seq={event.seq}</span>
            <span className="mc-event-message">{event.message}</span>
          </div>
        ))}
        <div style={{ height: bottomSpacer }} />
        {total === 0 && <p className="mc-event-empty">No events match the current filter.</p>}
      </div>
    </section>
  );
}
