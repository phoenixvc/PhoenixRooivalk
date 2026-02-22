"use client";

import { WasmThreatSimulator } from "../../components/WasmThreatSimulator";
import { WasmErrorBoundary } from "../../components/WasmErrorBoundary";
import styles from "./interactive-demo.module.css";

export default function InteractiveDemoPage() {
  return (
    <div className={styles.container}>
      <WasmErrorBoundary>
        <WasmThreatSimulator />
      </WasmErrorBoundary>
    </div>
  );
}
