/**
 * FlightStages - Visual timeline of rocket flight stages
 * Shows launch → burnout → coast → apogee → descent → landing progression
 */

import type { FlightStage, StageState, StageTimes } from "../types";
import { STAGE_SEQUENCE } from "../hooks/useSimulation";

interface FlightStagesProps {
  stageState: StageState;
  stageTimes: StageTimes;
  currentStage: FlightStage | null;
  isDarkMode?: boolean;
}

const STAGE_LABELS: Record<FlightStage, string> = {
  launch: "Launch",
  burnout: "Burnout",
  coast: "Coast",
  apogee: "Apogee",
  descent: "Descent",
  landing: "Landing",
};

const STAGE_ICONS: Record<FlightStage, string> = {
  launch: "LA",
  burnout: "BO",
  coast: "CO",
  apogee: "AP",
  descent: "DE",
  landing: "LD",
};

function formatTime(t: number): string {
  return `${t.toFixed(2)}s`;
}

export default function FlightStages({
  stageState,
  stageTimes,
  currentStage,
  isDarkMode = false,
}: FlightStagesProps) {
  const anyStageCompleted = STAGE_SEQUENCE.some((s) => stageState[s]);

  return (
    <div className={`flight-stages ${isDarkMode ? "dark" : ""}`}>
      <h3 className="panel-title">Flight Stages</h3>

      {!anyStageCompleted ? (
        <div className="stages-idle">
          <span>Launch to track stages</span>
        </div>
      ) : (
        <div className="stages-timeline">
          {STAGE_SEQUENCE.map((stage, idx) => {
            const completed = stageState[stage];
            const isCurrent = currentStage === stage;
            const time = stageTimes[stage];

            return (
              <div
                key={stage}
                className={[
                  "stage-item",
                  completed ? "completed" : "pending",
                  isCurrent ? "current" : "",
                ].join(" ")}
              >
                {/* Connector line before item (skip first) */}
                {idx > 0 && (
                  <div className={`stage-connector ${stageState[STAGE_SEQUENCE[idx - 1]] ? "done" : ""}`} />
                )}

                <div className="stage-dot">
                  <span className="stage-icon">{STAGE_ICONS[stage]}</span>
                </div>

                <div className="stage-info">
                  <span className="stage-name">{STAGE_LABELS[stage]}</span>
                  {time !== undefined && (
                    <span className="stage-time">{formatTime(time)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
