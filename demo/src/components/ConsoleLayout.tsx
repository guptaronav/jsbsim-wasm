import { SimulationState, SimulationActions } from "../hooks/useSimulation";
import ControlPanel from "./ControlPanel";
import EventFeed from "./EventFeed";
import RocketCanvas from "./RocketCanvas";
import TrajectoryMap from "./TrajectoryMap";

interface ConsoleLayoutProps extends SimulationState, SimulationActions {}

export default function ConsoleLayout({
  sdk,
  manifest,
  status,
  loading,
  running,
  launched,
  launchConsumed,
  samples,
  events,
  stageState,
  stageTimes,
  currentStage,
  intervalMs,
  startLaunch,
  pauseResume,
  reload,
  setIntervalMs,
  stepOnce,
}: ConsoleLayoutProps) {
  const latest = samples[samples.length - 1];

  return (
    <div className="console-layout">
      {/* Top row: visualization + map */}
      <div className="console-panel rocket-panel">
        <RocketCanvas samples={samples} stageState={stageState} running={running} />
      </div>

      <div className="console-panel map-panel">
        <TrajectoryMap samples={samples} launched={launched} />
      </div>

      {/* Middle-left: controls */}
      <div className="console-panel controls-panel">
        <ControlPanel
          sdk={sdk}
          loading={loading}
          running={running}
          launched={launched}
          launchConsumed={launchConsumed}
          latest={latest}
          intervalMs={intervalMs}
          onStartLaunch={startLaunch}
          onPauseResume={pauseResume}
          onReload={reload}
          onSetIntervalMs={setIntervalMs}
          onStepOnce={stepOnce}
          status={status}
        />
      </div>

      {/* Middle-right: placeholder for charts/editor */}
      <div className="console-panel placeholder-panel">
        <div className="panel-label">Charts / Editor</div>
        <div className="placeholder-content">
          <p style={{ textAlign: "center", color: "var(--muted)", marginTop: "2rem" }}>
            Telemetry charts and model editor coming soon
          </p>
        </div>
      </div>

      {/* Bottom: event feed spans full width on small screens, or shares space */}
      <div className="console-panel feed-panel">
        <EventFeed events={events} />
      </div>
    </div>
  );
}
