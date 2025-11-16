"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import styles from "./WasmThreatSimulator.module.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for WASM Threat Simulator
 *
 * Catches errors during WASM initialization and rendering,
 * providing a graceful fallback UI instead of crashing the entire page.
 */
export class WasmErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WASM Simulator Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.errorOverlay} role="alert">
          <div className={styles.errorTitle}>⚠️ Simulator Error</div>
          <div className={styles.errorMessage}>
            {this.state.error?.message ||
              "An unexpected error occurred while loading the simulator"}
          </div>
          <div className={styles.errorHint}>
            <button
              onClick={() => window.location.reload()}
              className="btn btn--secondary"
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
