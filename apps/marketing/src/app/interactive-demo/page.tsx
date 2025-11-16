import { WasmThreatSimulator } from "../../components/WasmThreatSimulator";
import { WasmErrorBoundary } from "../../components/WasmErrorBoundary";

export default function InteractiveDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4">
            Phoenix Rooivalk
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-6">
            Interactive Defense System Demonstration
          </p>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Experience the power of advanced counter-UAS defense technology
            built with Rust and WebAssembly for maximum performance. Control
            weapons, deploy drones, and neutralize aerial threats in real-time.
          </p>
        </div>

        <WasmErrorBoundary>
          <WasmThreatSimulator />
        </WasmErrorBoundary>

        <div className="mt-12 text-center">
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
      </div>
    </div>
  );
}
