/**
 * SimulationEventFeed - Real-time event logging for simulation
 * Displays simulation events with color-coded severity, filtering, and search
 */

import { useEffect, useRef, useState } from "react";
import type { SimulationEvent } from "../types";

interface SimulationEventFeedProps {
  events: SimulationEvent[];
  maxVisibleEvents?: number;
  isDarkMode?: boolean;
}

type EventFilter = "all" | "info" | "warning" | "critical";

// Distinct shape per severity so meaning never depends on color alone (WCAG).
function getEventIcon(level: string): string {
  if (level === "critical") return "■";
  if (level === "warning") return "▲";
  return "●";
}

function getEventLevelLabel(level: string): string {
  if (level === "critical") return "Critical";
  if (level === "warning") return "Warning";
  return "Info";
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export default function SimulationEventFeed({
  events,
  maxVisibleEvents = 50,
  isDarkMode = false,
}: SimulationEventFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<EventFilter>("all");
  const [paused, setPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Auto-scroll to latest event
  useEffect(() => {
    if (!paused && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events, paused]);

  // Filter events
  const filteredEvents = events
    .slice(-maxVisibleEvents)
    .filter((event) => {
      if (filter !== "all" && event.level !== filter) return false;
      if (searchTerm && !event.message.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });

  return (
    <div className="simulation-event-feed">
      {/* Controls */}
      <div className="event-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === "info" ? "active" : ""}`}
            onClick={() => setFilter("info")}
          >
            Info
          </button>
          <button
            className={`filter-btn ${filter === "warning" ? "active" : ""}`}
            onClick={() => setFilter("warning")}
          >
            Warnings
          </button>
          <button
            className={`filter-btn ${filter === "critical" ? "active" : ""}`}
            onClick={() => setFilter("critical")}
          >
            Critical
          </button>
        </div>

        <div className="event-search">
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="event-actions">
          <button
            className={`action-btn ${paused ? "active" : ""}`}
            onClick={() => setPaused(!paused)}
            title={paused ? "Resume" : "Pause"}
          >
            {paused ? "▶" : "⏸"}
          </button>
        </div>
      </div>

      {/* Event list */}
      <div ref={feedRef} className="event-list">
        {filteredEvents.length === 0 ? (
          <div className="event-empty">
            <span>{searchTerm ? "No matching events" : "Waiting for events..."}</span>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className={`event-item event-${event.level}`}>
              <div className="event-header">
                <span
                  className="event-icon"
                  role="img"
                  aria-label={getEventLevelLabel(event.level)}
                  title={getEventLevelLabel(event.level)}
                >
                  {getEventIcon(event.level)}
                </span>
                <span className="event-type">{event.type.toUpperCase()}</span>
                <span className="event-time">{formatTime(event.timestamp)}</span>
              </div>
              <div className="event-message">{event.message}</div>
              {event.data && (
                <div className="event-data">
                  {Object.entries(event.data).map(([key, value]) => (
                    <span key={key} className="data-item">
                      {key}: {String(value).substring(0, 50)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="event-stats">
        <span>
          Total: <strong>{events.length}</strong>
        </span>
        <span>
          Critical: <strong>{events.filter((e) => e.level === "critical").length}</strong>
        </span>
        <span>
          Warnings: <strong>{events.filter((e) => e.level === "warning").length}</strong>
        </span>
      </div>
    </div>
  );
}
