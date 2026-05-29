/**
 * LoadingScreen - Shown while the WASM simulation engine initializes
 */

interface LoadingScreenProps {
  status: string;
  isDarkMode?: boolean;
}

export default function LoadingScreen({ status, isDarkMode = false }: LoadingScreenProps) {
  return (
    <div className={`loading-screen ${isDarkMode ? "dark" : "light"}`}>
      <div className="loading-content">
        <div className="loading-rocket">🚀</div>
        <h2 className="loading-title">JSBSim Flight Console</h2>
        <div className="loading-spinner">
          <div className="spinner-ring" />
        </div>
        <p className="loading-status">{status}</p>
      </div>
    </div>
  );
}
