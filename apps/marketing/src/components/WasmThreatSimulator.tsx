"use client";

import React, { useRef, useState } from "react";
import styles from "./WasmThreatSimulator.module.css";

interface WasmThreatSimulatorProps {
  autoFullscreen?: boolean;
  isTeaser?: boolean;
  className?: string;
}

/**
 * WasmThreatSimulator - Embeds the Leptos/WASM threat simulator via iframe
 *
 * This component embeds the Rust-based WASM threat simulator built with Leptos
 * and Trunk using an iframe for true DOM isolation. This approach solves the
 * issue where the Leptos app was rendering outside the designated container.
 *
 * The iframe provides:
 * - True DOM isolation (prevents WASM from rendering outside container)
 * - Proper fullscreen support for the WASM app
 * - No CSS conflicts with the parent page
 */
export const WasmThreatSimulator: React.FC<WasmThreatSimulatorProps> = ({
  isTeaser = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleIframeLoad = () => {
    setIsLoading(false);
    // Check if iframe loaded successfully
    try {
      if (iframeRef.current?.contentWindow) {
        console.log("WASM iframe loaded successfully");
      }
    } catch {
      console.warn(
        "Cannot access iframe content (expected due to same-origin policy)",
      );
    }
  };

  const handleIframeError = () => {
    setError("Failed to load the threat simulator");
    setIsLoading(false);
  };

  return (
    <div
      ref={containerRef}
      className={`wasm-threat-simulator-container ${styles.container} ${isTeaser ? styles.containerTeaser : styles.containerFull} ${className}`}
    >
      {isLoading && (
        <div
          className={styles.loadingOverlay}
          role="status"
          aria-live="polite"
          aria-label="Loading threat simulator"
        >
          <div>
            <div className={styles.loadingText}>
              ⚡ Loading Threat Simulator...
            </div>
            <div className={styles.loadingSubtext}>
              Initializing WASM Runtime
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorOverlay}>
          <div className={styles.errorContent}>
            <div className={styles.errorTitle}>⚠️ Error Loading Simulator</div>
            <div className={styles.errorMessage}>{error}</div>
            <div className={styles.errorHint}>
              Please try refreshing the page
            </div>
          </div>
        </div>
      )}

      {/* Embed WASM app via iframe for true DOM isolation */}
      <iframe
        ref={iframeRef}
        src="/wasm-embed.html"
        className={styles.wasmIframe}
        title="Phoenix Rooivalk Threat Simulator"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-modals"
      />
    </div>
  );
};

export default WasmThreatSimulator;
