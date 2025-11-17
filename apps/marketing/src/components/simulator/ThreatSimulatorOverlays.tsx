import * as React from "react";

interface ThreatSimulatorOverlaysProps {
  showSimulationWarning: boolean;
  setShowSimulationWarning: (show: boolean) => void;
  showFullscreenPrompt: boolean;
  setShowFullscreenPrompt?: (show: boolean) => void;
  isTeaser: boolean;
  isFullscreen: boolean;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  showFullscreenIndicator?: boolean;
}

export const ThreatSimulatorOverlays: React.FC<
  ThreatSimulatorOverlaysProps
> = ({
  showSimulationWarning,
  setShowSimulationWarning,
  showFullscreenPrompt,
  setShowFullscreenPrompt,
  isTeaser: _isTeaser,
  isFullscreen,
  enterFullscreen,
  exitFullscreen: _exitFullscreen,
  showFullscreenIndicator: _showFullscreenIndicator = false,
}) => {
  return (
    <>
      {/* Simulation Warning */}
      {showSimulationWarning && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-red-900/95 backdrop-blur-md border border-red-500/60 rounded-lg p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-400 text-lg">⚠️</span>
              </div>
              <div>
                <div className="text-sm text-white font-semibold mb-1">
                  SIMULATION MODULE
                </div>
                <div className="text-xs text-red-200">
                  This interactive module is designed to visualize concepts. It
                  does not represent real-world sensor performance, detection
                  ranges, or decision latency.
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSimulationWarning(false)}
              className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/20 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Enhanced Fullscreen Prompt */}
      {showFullscreenPrompt && !isFullscreen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-orange-500/30 rounded-2xl p-10 max-w-md text-center shadow-2xl shadow-orange-500/20">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/50">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
              Fullscreen Mode
            </h3>
            <p className="text-slate-300 mb-8 leading-relaxed text-base">
              Experience the threat simulation in fullscreen for optimal
              tactical visualization and precise control.
            </p>
            <div className="flex flex-col gap-3">
              <button
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-orange-500/50 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                onClick={enterFullscreen}
                aria-label="Enter fullscreen mode"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                Enter Fullscreen
              </button>
              <button
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-8 py-3 rounded-xl transition-all"
                onClick={() => setShowFullscreenPrompt?.(false)}
                aria-label="Continue in windowed mode"
              >
                Continue in Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
