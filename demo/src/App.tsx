import { useSimulation } from "./hooks/useSimulation";
import ConsoleLayout from "./components/ConsoleLayout";
import ThemeToggle from "./components/ThemeToggle";

export default function App() {
  const sim = useSimulation();

  return (
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
        <ConsoleLayout {...sim} />
      </section>
    </div>
  );
}
