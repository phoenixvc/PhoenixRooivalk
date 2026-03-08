import type { Metadata } from "next";
import TimelinePageClient from "./TimelinePageClient";

export const metadata: Metadata = {
  title: "Development Timeline - Phoenix Rooivalk",
  description:
    "Phoenix Rooivalk's five-phase development roadmap from SBIR Phase I through full production. Track milestones for SkySnare, AeroNet, and the broader counter-UAS platform.",
  openGraph: {
    title: "Development Timeline - Phoenix Rooivalk",
    description:
      "Five-phase development roadmap from SBIR Phase I to full production. SkySnare, AeroNet, and counter-UAS platform milestones.",
  },
};

export default TimelinePageClient;
