export interface CaseStudyMetric {
  value: string;
  label: string;
}

export interface CaseStudy {
  title: string;
  summary: string;
  metrics: CaseStudyMetric[];
  outcomes: string[];
  imageUrl: string;
}

export const caseStudiesData: CaseStudy[] = [
  {
    title: "SkySnare™ at the Drone Racing League",
    summary:
      "The Drone Racing League (DRL) partnered with SkySnare™ to enhance pilot training and safety at their events, deploying detection across 3 venues over a 6-month trial.",
    metrics: [
      { value: "+25%", label: "Flight Time Improvement" },
      { value: "0", label: "Safety Incidents" },
      { value: "100%", label: "Event Coverage" },
    ],
    outcomes: [
      "Reduced unauthorized drone incursions by 100% across all monitored events",
      "Saved an estimated $45,000 in potential liability costs per season",
      "Decreased event setup time for airspace monitoring by 60% (4 hrs → 1.5 hrs)",
      "Enabled insurance premium reduction of 15% due to improved safety record",
    ],
    imageUrl: "/assets/case-study-1.png",
  },
  {
    title: "AeroNet™ Secures a Major International Airport",
    summary:
      "A major international airport implemented AeroNet™ to protect its airspace from unauthorized drone activity, covering 12 sq km of controlled airspace.",
    metrics: [
      { value: "24/7", label: "Monitoring" },
      { value: "<5s", label: "Response Time" },
      { value: "0", label: "Disruptions" },
    ],
    outcomes: [
      "Detected and classified 847 drone incursions in the first 12 months",
      "Achieved sub-200ms detection-to-alert latency across all sensor nodes",
      "Prevented an estimated $2.3M in potential runway closure costs",
      "Reduced false positive rate from 12% (legacy system) to 0.3%",
    ],
    imageUrl: "/assets/case-study-2.png",
  },
];
