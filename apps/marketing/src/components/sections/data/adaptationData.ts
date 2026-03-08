export interface AdaptationCardData {
  icon: string;
  title: string;
  description: string;
  metrics: { value: string; label: string }[];
}

export const adaptationCardsData: AdaptationCardData[] = [
  {
    icon: "🏢",
    title: "Civilian Applications",
    description: "Airports, infrastructure, and public events",
    metrics: [
      { value: "24/7", label: "Coverage" },
      { value: "<1s", label: "Alert Time" },
    ],
  },
  {
    icon: "🏭",
    title: "Commercial Security",
    description: "Corporate campuses, data centers, and ports",
    metrics: [
      { value: "Multi-site", label: "Scale" },
      { value: "99.9%", label: "Uptime" },
    ],
  },
  {
    icon: "🔬",
    title: "Research & Development",
    description: "University, government, and allied partnerships",
    metrics: [
      { value: "Global", label: "Reach" },
      { value: "Active", label: "Programs" },
    ],
  },
  {
    icon: "⚡",
    title: "Technology Licensing",
    description: "Sensor fusion, edge AI, and blockchain systems",
    metrics: [
      { value: "Patented", label: "Tech" },
      { value: "Open", label: "API" },
    ],
  },
];
