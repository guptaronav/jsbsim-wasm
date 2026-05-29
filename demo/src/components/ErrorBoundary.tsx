/**
 * ErrorBoundary - Catches React render errors and shows a recovery UI
 */

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  isDarkMode?: boolean;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, error: message };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: "" });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { isDarkMode = false } = this.props;
      return (
        <div className={`error-boundary ${isDarkMode ? "dark" : "light"}`}>
          <div className="error-content">
            <div className="error-icon">⚠</div>
            <h2 className="error-title">Simulation Error</h2>
            <p className="error-message">{this.state.error}</p>
            <button className="btn-primary error-reset" onClick={this.handleReset}>
              ↺ Reload Simulation
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
