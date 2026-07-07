interface SessionHeaderProps {
  sessionId: string;
  loading: boolean;
  running: boolean;
  launched: boolean;
  simFault: boolean;
  status: string;
}

export default function SessionHeader({
  sessionId,
  loading,
  running,
  launched,
  simFault,
  status,
}: SessionHeaderProps): JSX.Element {
  const modeLabel = loading ? "BOOTING" : running ? "LIVE" : launched ? "PAUSED" : "IDLE";
  const modeClass = loading ? "boot" : running ? "live" : launched ? "paused" : "idle";

  return (
    <header className="mc-session-header">
      <div className="mc-session-id">
        <span className="mc-session-label">SESSION</span>
        <span className="mc-session-value">{sessionId}</span>
      </div>
      <div className="mc-session-status" role="status">
        {status}
      </div>
      <div className="mc-chips">
        <span className={`mc-chip mc-chip--${modeClass}`}>{modeLabel}</span>
        <span className={`mc-chip ${simFault ? "mc-chip--fault" : "mc-chip--ok"}`}>
          {simFault ? "SIM FAULT" : "SIM OK"}
        </span>
      </div>
    </header>
  );
}
