"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import styles from "./WasmThreatSimulator.module.css";

interface WasmThreatSimulatorProps {
  autoFullscreen?: boolean;
  isTeaser?: boolean;
  className?: string;
}

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
        const maxRetries = 10;

        while (!mountElement && retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          mountElement = document.getElementById(uniqueMountId);
          retries++;
        }

        if (!mountElement) {
          throw new Error(
            `Mount element not found after ${maxRetries} retries`,
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
        }, 100);

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

  // Dynamically load and scope WASM CSS to prevent global interference
  useEffect(() => {
    if (!cssUrl || wasmStylesLoaded) return;

    const loadWasmStyles = async () => {
      try {
        const response = await fetch(cssUrl);
        const cssText = await response.text();

        // Import postcss dynamically for CSS transformation
        const postcss = (await import("postcss")).default;

        // Create a scoped style element
        const styleElement = document.createElement("style");
        styleElement.id = `wasm-styles-${uniqueMountId}`;

        // Generate unique scope identifier
        const scopeClass = `.wasm-threat-simulator-container`;
        const keyframePrefix = `wasm-${uniqueMountId}`;

        // PostCSS plugin to scope CSS selectors and handle @keyframes
        const scopePlugin = () => {
          interface PostCSSNode {
            parent?: PostCSSNode;
            type: string;
            name?: string;
            params?: string;
            selector?: string;
            walkDecls?: (callback: (decl: PostCSSDecl) => void) => void;
          }

          interface PostCSSAtRule extends PostCSSNode {
            params: string;
          }

          interface PostCSSRule extends PostCSSNode {
            selector: string;
            parent?: PostCSSNode;
            walkDecls: (callback: (decl: PostCSSDecl) => void) => void;
          }

          interface PostCSSDecl {
            prop: string;
            value: string;
          }

          interface PostCSSRoot {
            walkAtRules: (
              name: string,
              callback: (atRule: PostCSSAtRule) => void,
            ) => void;
            walkRules: (callback: (rule: PostCSSRule) => void) => void;
          }

          return {
            postcssPlugin: "scope-wasm-css",
            Once(root: PostCSSRoot) {
              // Track animation name mappings
              const animationMap = new Map<string, string>();

              // First pass: rename @keyframes and track mappings
              root.walkAtRules("keyframes", (atRule: PostCSSAtRule) => {
                const originalName = atRule.params.trim();
                const scopedName = `${keyframePrefix}-${originalName}`;
                animationMap.set(originalName, scopedName);
                atRule.params = scopedName;
              });

              // Second pass: scope all selectors and update animation references
              root.walkRules((rule: PostCSSRule) => {
                // Skip rules inside @keyframes
                if (
                  rule.parent &&
                  rule.parent.type === "atrule" &&
                  rule.parent.name === "keyframes"
                ) {
                  return;
                }

                // Scope selectors (handles :root exclusions and global selectors)
                rule.selector = rule.selector
                  .split(",")
                  .map((selector: string) => {
                    const trimmed = selector.trim();

                    // Skip problematic global selectors that shouldn't be scoped
                    if (
                      trimmed.startsWith(":root") ||
                      trimmed === "body" ||
                      trimmed === "html" ||
                      trimmed === "*"
                    ) {
                      return "";
                    }

                    // Replace #app with the unique mount ID to ensure styles apply after ID restoration
                    let scopedSelector = trimmed.replace(
                      /^#app\b/,
                      `#${uniqueMountId}`,
                    );

                    // Replace #app when it appears as a descendant selector
                    scopedSelector = scopedSelector.replace(
                      /\s+#app\b/g,
                      ` #${uniqueMountId}`,
                    );

                    // Prefix with container class
                    return `${scopeClass} ${scopedSelector}`;
                  })
                  .filter((s: string) => s) // Remove empty selectors
                  .join(", ");

                // Update animation-name and animation shorthand properties
                rule.walkDecls((decl: PostCSSDecl) => {
                  if (decl.prop === "animation-name") {
                    const names = decl.value.split(",").map((n: string) => {
                      const name = n.trim();
                      return animationMap.get(name) || name;
                    });
                    decl.value = names.join(", ");
                  } else if (decl.prop === "animation") {
                    // Handle animation shorthand: find and replace animation names
                    let value = decl.value;
                    animationMap.forEach((scopedName, originalName) => {
                      // Escape special regex characters in animation name
                      const escapedName = originalName.replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&",
                      );
                      // Use word boundary regex to match animation names
                      // eslint-disable-next-line security/detect-non-literal-regexp
                      const regex = new RegExp(`\\b${escapedName}\\b`, "g");
                      value = value.replace(regex, scopedName);
                    });
                    decl.value = value;
                  }
                });
              });
            },
          };
        };

        scopePlugin.postcss = true;

        // Process CSS with PostCSS
        const result = await postcss([scopePlugin()]).process(cssText, {
          from: undefined,
        });

        styleElement.textContent = result.css;
        document.head.appendChild(styleElement);
        setWasmStylesLoaded(true);
      } catch (err) {
        console.warn("Failed to load WASM styles:", err);
        setWasmStylesLoaded(true); // Continue without styles
      }
    };

    loadWasmStyles();

    return () => {
      // Cleanup scoped styles on unmount
      const styleElement = document.getElementById(
        `wasm-styles-${uniqueMountId}`,
      );
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [cssUrl, uniqueMountId, wasmStylesLoaded]);

  return (
    <div
      ref={containerRef}
      className={`wasm-threat-simulator-container ${styles.container} ${isTeaser ? styles.containerTeaser : styles.containerFull} ${className}`}
    >
      {/* WASM styles are now dynamically loaded and scoped - no inline overrides needed */}

      {isLoading && (
        <div className={styles.loadingOverlay}>
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
