"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import styles from "./WasmThreatSimulator.module.css";

interface WasmThreatSimulatorProps {
  autoFullscreen?: boolean;
  isTeaser?: boolean;
  className?: string;
}

// Configuration constants
const WASM_INIT_TIMEOUT_MS = 100; // Time to wait before restoring element ID
const MOUNT_RETRY_INTERVAL_MS = 50; // Interval between mount element checks
const MAX_MOUNT_RETRIES = 10; // Maximum attempts to find mount element

// Singleton flag to prevent multiple WASM instances
// Leptos targets a specific mount point and multiple instances would conflict
let wasmInstanceInitialized = false;

/**
 * WasmThreatSimulator - Embeds the Leptos/WASM threat simulator
 *
 * This component loads and initializes the Rust-based WASM threat simulator
 * built with Leptos and Trunk. The WASM module provides a high-performance
 * simulation with native-like performance.
 *
 * Note: Only one instance of this component can be active at a time due to
 * WASM module constraints. Multiple instances will be prevented automatically.
 */
export const WasmThreatSimulator: React.FC<WasmThreatSimulatorProps> = ({
  autoFullscreen = false,
  isTeaser = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wasmInitialized, setWasmInitialized] = useState(false);
  const [cssUrl, setCssUrl] = useState<string | null>(null);
  const [wasmStylesLoaded, setWasmStylesLoaded] = useState(false);

  // Generate unique mount ID for this instance
  const mountId = useId().replace(/:/g, "-"); // Replace React's : separator
  const uniqueMountId = `wasm-mount-${mountId}`;

  useEffect(() => {
    let mounted = true;

    const initWasm = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Enforce singleton: only one WASM instance can be initialized
        if (wasmInstanceInitialized) {
          console.warn(
            "WASM Threat Simulator is already initialized. Only one instance is allowed.",
          );
          setError(
            "Another simulator instance is already active. Only one can run at a time.",
          );
          setIsLoading(false);
          return;
        }

        // Mark this instance as initialized
        wasmInstanceInitialized = true;

        // Resolve asset URLs via manifest to avoid hardcoded hashes
        const manifest = await fetch("/wasm/manifest.json", {
          cache: "no-store",
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch((err) => {
            console.warn("Failed to load WASM manifest:", err);
            return null;
          });

        const pick = (ext: string, fallback?: string) => {
          if (manifest && Array.isArray(manifest.files)) {
            const match = manifest.files.find((f: string) => f.endsWith(ext));
            if (match) return `/wasm/${match}`;
          }
          return fallback || null;
        };

        const jsUrl = pick(
          ".js",
          "/wasm/threat-simulator-desktop-43e4df905ff42f76.js",
        );
        const wasmUrl = pick(
          ".wasm",
          "/wasm/threat-simulator-desktop-43e4df905ff42f76_bg.wasm",
        );
        const resolvedCssUrl = pick(".css");

        // Set CSS URL in state for rendering
        if (mounted && resolvedCssUrl) {
          setCssUrl(resolvedCssUrl);
        } else if (mounted) {
          console.warn("WASM stylesheet not found in manifest");
        }

        // Validate required assets
        if (!jsUrl || !wasmUrl) {
          throw new Error("Required WASM assets (JS or WASM) not found");
        }

        // Wait for mount element to be available with retry logic
        let mountElement = document.getElementById(uniqueMountId);
        let retries = 0;

        while (!mountElement && retries < MAX_MOUNT_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, MOUNT_RETRY_INTERVAL_MS),
          );
          mountElement = document.getElementById(uniqueMountId);
          retries++;
        }

        if (!mountElement) {
          throw new Error(
            `Mount element not found after ${MAX_MOUNT_RETRIES} retries`,
          );
        }
        const originalId = mountElement.id;
        mountElement.id = "app";

        // Load WASM via dynamic import to avoid inline scripts/CSP issues
        const mod = await import(/* webpackIgnore: true */ jsUrl);
        const init = mod.default || mod.__wbg_init;
        if (typeof init !== "function")
          throw new Error("Invalid WASM module: missing default init");
        await init({ module_or_path: wasmUrl });

        // Restore original unique ID after Leptos mounts
        setTimeout(() => {
          if (mountElement && mounted) {
            mountElement.id = originalId;
          }
        }, WASM_INIT_TIMEOUT_MS);

        if (!mounted) return;

        setWasmInitialized(true);
        setIsLoading(false);

        // Removed auto-fullscreen as it interferes with page scrolling
        // Users can manually enter fullscreen if needed
        // if (autoFullscreen && containerRef.current?.requestFullscreen) {
        //   setTimeout(() => {
        //     containerRef.current!.requestFullscreen().catch(() => {
        //       /* ignore: user gesture required or denied */
        //     });
        //   }, 500);
        // }
      } catch (err) {
        console.error("Failed to initialize WASM module:", err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load the threat simulator",
          );
          setIsLoading(false);
        }
      }
    };

    initWasm();

    return () => {
      mounted = false;
      // Reset singleton flag when component unmounts
      wasmInstanceInitialized = false;
    };
  }, [autoFullscreen, uniqueMountId]);

  // Load WASM CSS directly without any transformation
  useEffect(() => {
    if (!cssUrl || wasmStylesLoaded) return;

    // Create a <link> element to load the WASM CSS directly
    const linkElement = document.createElement("link");
    linkElement.id = `wasm-styles-${uniqueMountId}`;
    linkElement.rel = "stylesheet";
    linkElement.href = cssUrl;
    
    linkElement.onload = () => {
      // After CSS loads, inject critical overrides to make it work in a container
      const styleOverrides = document.createElement("style");
      styleOverrides.id = `wasm-overrides-${uniqueMountId}`;
      styleOverrides.textContent = `
        /* Force WASM app to work within container instead of fullscreen */
        #${uniqueMountId} {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          position: relative !important;
        }
        
        /* Fix app-container to fill the mount point */
        #${uniqueMountId} .app-container {
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
        }
        
        /* Fix game canvas to be positioned relative, not fixed */
        #${uniqueMountId} .game-canvas {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          flex: 1 !important;
        }
        
        /* Fix loading screen positioning */
        #${uniqueMountId} .loading-container {
          position: absolute !important;
        }
        
        /* Fix all panels that use fixed positioning */
        #${uniqueMountId} .stats-panel,
        #${uniqueMountId} .control-bar,
        #${uniqueMountId} .hud-bar,
        #${uniqueMountId} .event-feed,
        #${uniqueMountId} .energy-panel,
        #${uniqueMountId} .drone-panel {
          position: absolute !important;
        }
      `;
      document.head.appendChild(styleOverrides);
      setWasmStylesLoaded(true);
    };
    
    linkElement.onerror = () => {
      console.warn("Failed to load WASM styles from:", cssUrl);
      setWasmStylesLoaded(true); // Continue without styles
    };

    document.head.appendChild(linkElement);

    return () => {
      // Cleanup styles on unmount
      const linkElem = document.getElementById(`wasm-styles-${uniqueMountId}`);
      const overridesElem = document.getElementById(`wasm-overrides-${uniqueMountId}`);
      if (linkElem) linkElem.remove();
      if (overridesElem) overridesElem.remove();
    };
  }, [cssUrl, uniqueMountId, wasmStylesLoaded]);

  return (
    <div
      ref={containerRef}
      className={`wasm-threat-simulator-container ${styles.container} ${isTeaser ? styles.containerTeaser : styles.containerFull} ${className}`}
    >
      {/* WASM styles are now dynamically loaded and scoped - no inline overrides needed */}

      {isLoading && (
        <div
          className={styles.loadingOverlay}
          role="status"
          aria-live="polite"
          aria-label="Loading threat simulator"
        >
          <div className={styles.loadingText}>
            ⚡ Loading Threat Simulator...
          </div>
          <div className={styles.loadingSubtext}>Initializing WASM Runtime</div>
        </div>
      )}

      {error && (
        <div className={styles.errorOverlay}>
          <div className={styles.errorTitle}>⚠️ Error Loading Simulator</div>
          <div className={styles.errorMessage}>{error}</div>
          <div className={styles.errorHint}>Please try refreshing the page</div>
        </div>
      )}

      {/* Mount point for the Leptos WASM app - uses unique ID to prevent conflicts */}
      <div
        id={uniqueMountId}
        className={`${styles.wasmMount} ${wasmInitialized ? styles.wasmMountVisible : styles.wasmMountHidden}`}
      />
    </div>
  );
};

export default WasmThreatSimulator;
