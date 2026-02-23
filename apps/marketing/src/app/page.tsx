import type { Metadata } from "next";
import * as React from "react";
import HomePage from "./home";

export const metadata: Metadata = {
  title: "Phoenix Rooivalk - Autonomous Counter-Drone Defense Platform",
  description:
    "Phoenix Rooivalk delivers SAE Level 4 autonomous counter-drone defense. SkySnare for consumer protection, AeroNet for enterprise security. Sub-200ms response in RF-denied environments.",
  openGraph: {
    title: "Phoenix Rooivalk - Autonomous Counter-Drone Defense Platform",
    description:
      "SAE Level 4 autonomous counter-drone defense. SkySnare for consumer protection, AeroNet for enterprise security. Sub-200ms response in RF-denied environments.",
  },
};

export default function Page(): React.ReactElement {
  return <HomePage />;
}
