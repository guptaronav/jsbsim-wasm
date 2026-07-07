import { useMemo } from "react";
import { useMissionControl } from "./hooks/useMissionControl";
import { useChannelListConfig } from "./hooks/useChannelListConfig";
import { useTimeline } from "./hooks/useTimeline";
import { DEFAULT_TILE_CHANNELS, DEFAULT_CHART_CHANNELS, CHANNELS } from "../lib/channels";
import { mergeLiveEvents } from "./lib/liveFeed";
import { eventsUpToTime, frameAtTime, samplesUpToTime } from "./lib/sessionSelectors";
import { sampleToAircraftState, sampleToTrajectoryPoint } from "./lib/telemetryAdapters";
import SessionHeader from "./components/SessionHeader";
import SimControlPanel from "./components/SimControlPanel";
import MetricTiles from "./components/MetricTiles";
import LiveEventStream from "./components/LiveEventStream";
import TelemetryChart from "./components/TelemetryChart";
import GpsTrajectory3D from "./components/GpsTrajectory3D";
import TimelineScrubber from "./components/TimelineScrubber";
import FlightViewer3D from "../components/FlightViewer3D";
import type { AircraftState } from "../types";

const MAX_LIVE_EVENTS = 20000;
const DEFAULT_LAT = 37.4419;
const DEFAULT_LON = -122.143;

const EMPTY_AIRCRAFT_STATE: AircraftState = {
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  attitude: { pitch: 0, roll: 0, yaw: 0 },
  latitude: DEFAULT_LAT,
  longitude: DEFAULT_LON,
  altitude: 0,
  airspeed: 0,
  mach: 0,
  verticalVelocity: 0,
};

export default function MissionControlPage(): JSX.Element {
  const { sim, sessionId, sensorLog } = useMissionControl();
  const tileConfig = useChannelListConfig("mc.tileChannels.v1", DEFAULT_TILE_CHANNELS);
  const seriesConfig = useChannelListConfig("mc.chartSeries.v1", DEFAULT_CHART_CHANNELS);
  const timeline = useTimeline(sim.samples);

  const simFault = !sim.loading && sim.status.startsWith("Startup failed:");

  const liveEvents = useMemo(
    () => mergeLiveEvents(sim.events, sensorLog, MAX_LIVE_EVENTS),
    [sim.events, sensorLog]
  );

  // Every panel derives from these two values, so scrubbing the timeline
  // deterministically drives tiles, chart, 3D rocket, GPS, and events alike.
  const displaySamples = timeline.isReplaying
    ? samplesUpToTime(sim.samples, timeline.scrubTime)
    : sim.samples;
  const displayLatestSample = timeline.isReplaying
    ? frameAtTime(sim.samples, timeline.scrubTime)
    : sim.samples[sim.samples.length - 1];
  const displayEvents = timeline.isReplaying
    ? eventsUpToTime(liveEvents, timeline.scrubTime)
    : liveEvents;

  const trajectoryPoints = useMemo(() => displaySamples.map(sampleToTrajectoryPoint), [displaySamples]);
  const aircraftState = useMemo(
    () => (displayLatestSample ? sampleToAircraftState(displayLatestSample) : EMPTY_AIRCRAFT_STATE),
    [displayLatestSample]
  );
  const refLat = sim.samples.length > 0 ? sim.samples[0].latDeg : DEFAULT_LAT;
  const refLon = sim.samples.length > 0 ? sim.samples[0].lonDeg : DEFAULT_LON;

  if (sim.loading) {
    return (
      <div className="mc-boot-screen" role="status">
        <p>{sim.status}</p>
      </div>
    );
  }

  if (simFault) {
    return (
      <div className="mc-boot-screen mc-boot-screen--error" role="alert">
        <p>{sim.status}</p>
        <button type="button" className="mc-btn mc-btn--start" onClick={sim.reload}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mc-shell">
      <SessionHeader
        sessionId={sessionId}
        loading={sim.loading}
        running={sim.running}
        launched={sim.launched}
        simFault={simFault}
        status={timeline.isReplaying ? `Replaying at t=${timeline.scrubTime.toFixed(2)}s` : sim.status}
      />

      <MetricTiles
        sample={displayLatestSample}
        tileChannels={tileConfig.channels}
        onChangeTile={tileConfig.setChannel}
        onRemoveTile={tileConfig.removeChannel}
        onAddTile={() => tileConfig.addChannel(CHANNELS[0].id)}
      />

      <div className="mc-main-grid">
        <div className="mc-column mc-column--left">
          <SimControlPanel
            tickMs={sim.intervalMs}
            durationMs={sim.durationMs}
            initialAltM={sim.initialAltM}
            onTickMsChange={sim.setIntervalMs}
            onDurationMsChange={sim.setDurationMs}
            onInitialAltMChange={sim.setInitialAltM}
            loading={sim.loading}
            running={sim.running}
            launched={sim.launched}
            launchConsumed={sim.launchConsumed}
            onStart={() => {
              timeline.goLive();
              if (!sim.launchConsumed) sim.startLaunch();
              else if (!sim.launched) sim.reload();
              else sim.pauseResume();
            }}
            onStop={sim.pauseResume}
          />
          <LiveEventStream events={displayEvents} />
        </div>

        <div className="mc-column mc-column--center">
          <TelemetryChart
            samples={displaySamples}
            seriesChannels={seriesConfig.channels}
            onAddSeries={seriesConfig.addChannel}
            onRemoveSeries={seriesConfig.removeChannel}
          />
          <section className="mc-panel mc-rocket-panel" aria-label="3D rocket view">
            <h2 className="mc-panel-title">Rocket View</h2>
            <div className="mc-rocket-canvas">
              <FlightViewer3D
                aircraftState={aircraftState}
                trajectoryPoints={trajectoryPoints}
                referenceLatitude={refLat}
                referenceLongitude={refLon}
                referenceAltitude={0}
                isRunning={sim.running && !timeline.isReplaying}
              />
            </div>
          </section>
        </div>

        <div className="mc-column mc-column--right">
          <section className="mc-panel mc-gps-panel" aria-label="GPS trajectory">
            <h2 className="mc-panel-title">GPS Trajectory</h2>
            <GpsTrajectory3D
              trajectoryPoints={trajectoryPoints}
              referenceLatitude={refLat}
              referenceLongitude={refLon}
            />
          </section>
        </div>
      </div>

      <TimelineScrubber
        sessionId={sessionId}
        samples={sim.samples}
        isReplaying={timeline.isReplaying}
        scrubTime={timeline.scrubTime}
        isPlaying={timeline.isPlaying}
        speed={timeline.speed}
        minTime={timeline.minTime}
        maxTime={timeline.maxTime}
        onEnterReplay={timeline.enterReplay}
        onGoLive={timeline.goLive}
        onScrub={timeline.scrubTo}
        onTogglePlay={timeline.togglePlay}
        onSpeedChange={timeline.setSpeed}
      />
    </div>
  );
}
