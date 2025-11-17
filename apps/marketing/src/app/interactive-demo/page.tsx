"use client";

import { useEffect, useState } from "react";
import { WasmThreatSimulator } from "../../components/WasmThreatSimulator";
import { WasmErrorBoundary } from "../../components/WasmErrorBoundary";
import Link from "next/link";

export default function InteractiveDemoPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreen changes (e.g., when user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
            <button
              onClick={toggleFullscreen}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
              aria-label="Enter fullscreen mode"
              type="button"
            >
              🖥️ Enter Fullscreen Mode
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4">
              Phoenix Rooivalk
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-6">
              Interactive Defense System Demonstration
            </p>
            <p className="text-gray-400 max-w-3xl mx-auto">
              Experience the power of advanced counter-UAS defense technology
              built with Rust and WebAssembly for maximum performance. Control
              weapons, deploy drones, and neutralize aerial threats in
              real-time.
            </p>
          </div>
        </div>
      )}

      {/* Simulator Container */}
      <div className={isFullscreen ? "h-screen" : "container mx-auto px-4"}>
        <WasmErrorBoundary>
          <WasmThreatSimulator />
        </WasmErrorBoundary>

        {/* Fullscreen hint */}
        {isFullscreen && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-white px-6 py-3 rounded-lg text-sm backdrop-blur-sm">
            Press <kbd className="px-2 py-1 bg-gray-700 rounded">ESC</kbd> to
            exit fullscreen
          </div>
        )}
      </div>

      {/* System Capabilities - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="container mx-auto px-4 py-12">
          <div className="bg-gray-800/50 p-8 rounded-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-green-400 mb-4">
              System Capabilities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-cyan-400">
                  🛡️ Radar Detection
                </h3>
                <p className="text-gray-300 text-sm">
                  Advanced radar systems detect and track multiple aerial
                  threats simultaneously with sub-meter precision and real-time
                  updates.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-yellow-400">
                  📡 Electronic Warfare
                </h3>
                <p className="text-gray-300 text-sm">
                  Sophisticated jamming technology disrupts enemy communications
                  and navigation systems, creating electronic safe zones.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-fuchsia-400">
                  🚀 Kinetic Interceptors
                </h3>
                <p className="text-gray-300 text-sm">
                  Precision-guided effectors neutralize threats with minimal
                  collateral damage using advanced targeting algorithms.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
