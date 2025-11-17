"use client";

import { WasmThreatSimulator } from "../../components/WasmThreatSimulator";
import { WasmErrorBoundary } from "../../components/WasmErrorBoundary";

export default function InteractiveDemoPage() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <WasmErrorBoundary>
        <WasmThreatSimulator />
      </WasmErrorBoundary>
    </div>
  );
}
