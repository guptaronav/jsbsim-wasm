import { useEffect, useRef, useState } from "react";
import type { EventEntry, EventLevel, EventKind } from "../types";

interface EventFeedProps {
  events: EventEntry[];
}

type FilterMode = "all" | "stages" | "errors";

const LEVEL_COLORS: Record<EventLevel, string> = {
  info: "var(--muted)",
  warn: "#f59e0b",
  error: "#ef4444",
};

const KIND_BADGES: Record<EventKind, { label: string; color: string }> = {
  stage: { label: "STAGE", color: "#0d9488" },
  log: { label: "LOG", color: "#475569" },
  alert: { label: "ALERT", color: "#f59e0b" },
};

function formatSimTime(t: number): string {
  return `t=${t.toFixed(2)}s`;
}

export default function EventFeed({ events }: EventFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [autoScroll, setAutoScroll] = useState(true);

  const filtered = events.filter((e) => {
    if (filter === "stages") return e.kind === "stage";
    if (filter === "errors") return e.level === "error";
    return true;
  });

  // Auto-scroll to bottom when new events arrive, unless user scrolled up
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filtered.length, autoScroll]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }

  return (
    <div className="event-feed-shell">
      <div className="event-feed-header">
        <span className="panel-label">Event Feed</span>
        <div className="event-feed-filters">
          {(["all", "stages", "errors"] as FilterMode[]).map((m) => (
            <button
              key={m}
              className={`filter-pill ${filter === m ? "active" : ""}`}
              onClick={() => setFilter(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="event-count">{filtered.length}</span>
      </div>

      <div
        ref={containerRef}
        className="event-feed-list"
        onScroll={handleScroll}
      >
        {filtered.length === 0 ? (
          <div className="event-feed-empty">No events yet.</div>
        ) : (
          filtered.map((e) => (
            <div
              key={e.id}
              className={`event-row event-row--${e.level}`}
            >
              <span
                className="event-badge"
                style={{ background: KIND_BADGES[e.kind].color }}
              >
                {KIND_BADGES[e.kind].label}
              </span>
              <span className="event-simtime">{formatSimTime(e.simTime)}</span>
              <span className="event-message" style={{ color: LEVEL_COLORS[e.level] }}>
                {e.message}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {!autoScroll && (
        <button
          className="scroll-to-bottom"
          onClick={() => {
            setAutoScroll(true);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          ↓ Latest
        </button>
      )}
    </div>
  );
}
