import type { Metadata } from "next";
import InteractiveDemoPageClient from "./InteractiveDemoPageClient";

export const metadata: Metadata = {
  title: "Interactive Threat Simulator - Phoenix Rooivalk",
  description:
    "Try the Phoenix Rooivalk interactive threat simulator. Experience real-time counter-drone detection and neutralization scenarios powered by WebAssembly in your browser.",
  openGraph: {
    title: "Interactive Threat Simulator - Phoenix Rooivalk",
    description:
      "Experience real-time counter-drone detection and neutralization scenarios in the Phoenix Rooivalk WebAssembly threat simulator.",
  },
};

export default InteractiveDemoPageClient;
