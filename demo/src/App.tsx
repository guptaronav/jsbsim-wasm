import { useSimulation } from "./hooks/useSimulation";
import { useTheme } from "./hooks/useTheme";
import ConsoleLayout from "./components/ConsoleLayout";
import LoadingScreen from "./components/LoadingScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import ThemeToggle from "./components/ThemeToggle";

export default function App() {
  const sim = useSimulation();
  const { theme } = useTheme();

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const startupFailed = !sim.loading && sim.status.startsWith("Startup failed:");

  if (sim.loading) {
    return <LoadingScreen status={sim.status} isDarkMode={isDarkMode} />;
  }

  if (startupFailed) {
    return (
      <div className={`error-boundary ${isDarkMode ? "dark" : "light"}`}>
        <div className="error-content">
          <div className="error-icon">⚠</div>
          <h2 className="error-title">Simulation Failed to Load</h2>
          <p className="error-message">{sim.status}</p>
          <button className="btn-primary error-reset" onClick={sim.reload}>
            ↺ Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary isDarkMode={isDarkMode}>
      <div className="app-shell">
        <header className="hero">
          <div className="hero-controls">
            <div>
              <p className="kicker">🚀 JSBSim Simulation Console</p>
              <h1>Hobby Rocket Flight Simulator</h1>
              <p className="copy">
                A fully browser-based simulation pipeline. Configure your rocket, launch, and watch real-time telemetry across
                GPS trajectory, 2D visualization, flight events, and live property inspector.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <section className="console-container">
          <ConsoleLayout
            status={sim.status}
            loading={sim.loading}
            running={sim.running}
            launched={sim.launched}
            launchConsumed={sim.launchConsumed}
            samples={sim.samples}
            events={sim.events}
            intervalMs={sim.intervalMs}
            stageState={sim.stageState}
            stageTimes={sim.stageTimes}
            currentStage={sim.currentStage}
            startLaunch={sim.startLaunch}
            pauseResume={sim.pauseResume}
            reload={sim.reload}
            setIntervalMs={sim.setIntervalMs}
            stepOnce={sim.stepOnce}
            isDarkMode={isDarkMode}
          />
        </section>
      </div>
    </ErrorBoundary>
  );
}
