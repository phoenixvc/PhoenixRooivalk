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
        <div className="container mx-auto px-4 py-16 mb-12">
          <div className="bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-black/70 backdrop-blur-sm border border-orange-500/20 p-10 rounded-2xl shadow-2xl shadow-orange-500/10 max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 mb-8 text-center">
              System Capabilities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="space-y-3 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/10 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-105">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">🛡️</div>
                  <h3 className="text-xl font-bold text-cyan-400">
                    Radar Detection
                  </h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Advanced radar systems detect and track multiple aerial
                  threats simultaneously with sub-meter precision and real-time
                  updates.
                </p>
              </div>
              <div className="space-y-3 p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/10 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20 hover:scale-105">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">📡</div>
                  <h3 className="text-xl font-bold text-yellow-400">
                    Electronic Warfare
                  </h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Sophisticated jamming technology disrupts enemy communications
                  and navigation systems, creating electronic safe zones.
                </p>
              </div>
              <div className="space-y-3 p-6 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-xl hover:bg-fuchsia-500/10 transition-all duration-300 hover:shadow-lg hover:shadow-fuchsia-500/20 hover:scale-105">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">🚀</div>
                  <h3 className="text-xl font-bold text-fuchsia-400">
                    Kinetic Interceptors
                  </h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
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
