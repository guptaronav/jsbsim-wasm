import { navigate, useRoute } from "./lib/router";
import MissionControlPage from "./mission-control/MissionControlPage";
import DesignerPage from "./designer/DesignerPage";

export default function App(): JSX.Element {
  const route = useRoute();
  const surface = route === "designer" ? "designer" : "mission-control";

  return (
    <div className="app-shell" data-surface={surface}>
      <nav className="surface-nav" aria-label="Surface navigation">
        <span className="surface-nav-brand">JSBSim WASM</span>
        <button
          type="button"
          className="surface-nav-link"
          aria-current={route === "mission-control" ? "page" : undefined}
          onClick={() => navigate("mission-control")}
        >
          Mission Control
        </button>
        <button
          type="button"
          className="surface-nav-link"
          aria-current={route === "designer" ? "page" : undefined}
          onClick={() => navigate("designer")}
        >
          Model Designer
        </button>
      </nav>
      <div className="app-route">
        {route === "designer" ? <DesignerPage /> : <MissionControlPage />}
      </div>
    </div>
  );
}
