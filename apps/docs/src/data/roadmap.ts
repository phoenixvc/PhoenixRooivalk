/**
 * Roadmap & Timeline Data
 *
 * Single source of truth for all timeline and milestone information.
 */

import type { TimelinePoint } from "./types";

/** Current Status */
export const currentStatus = {
  phase: "Pre-Seed / Development",
  week: 48,
  year: 2025,
  lastUpdate: "December 1, 2025",

  highlights: {
    hardware: "Net launcher and net designs complete - ready for prototyping",
    software: "370+ commits, 40+ PRs, 10+ ADRs in Week 48",
    revenue: "x402 payment protocol live",
    validation: "International-first strategy confirmed",
  },
};

/** Development Phases */
export const developmentPhases = {
  phase1: {
    name: "Foundation",
    timeline: "Months 1-6",
    status: "In Progress",
    objectives: [
      "Core system development",
      "Blockchain integration (Solana)",
      "Hardware platform (NVIDIA Jetson)",
      "Initial testing - lab and controlled environment",
    ],
  },
  phase2: {
    name: "Enhancement",
    timeline: "Months 7-12",
    status: "Planned",
    objectives: [
      "AI/ML integration (Morpheus Network)",
      "Multi-sensor fusion",
      "Swarm defense coordination",
      "Field testing - real-world validation",
    ],
  },
  phase3: {
    name: "Production",
    timeline: "Months 13-18",
    status: "Planned",
    objectives: [
      "Manufacturing scale-up (50+ units/month)",
      "International deployment",
      "Service network establishment",
      "Technology transfer programs",
    ],
  },
};

/** Quarterly Roadmap */
export const quarterlyRoadmap: TimelinePoint[] = [
  {
    quarter: "Q1",
    year: 2026,
    description: "Net launcher prototype complete, first EU pilot installation",
    status: "planned",
  },
  {
    quarter: "Q2",
    year: 2026,
    description:
      "EU certification achieved, 3 installations operational, x402 enterprise contracts",
    status: "planned",
  },
  {
    quarter: "Q3",
    year: 2026,
    description:
      "Series A fundraise with proven revenue, 5 operational installations",
    status: "planned",
  },
  {
    quarter: "Q4",
    year: 2026,
    description:
      "Canada expansion begins, manufacturing partnerships established",
    status: "planned",
  },
  {
    quarter: "Q1",
    year: 2027,
    description: "10+ installations, South Africa market preparation",
    status: "target",
  },
  {
    quarter: "Q2",
    year: 2027,
    description: "South African entity established, local partnerships",
    status: "target",
  },
];

/** Key Milestones */
export const milestones = {
  completed: [
    {
      date: "Week 48, 2025",
      milestone: "Net launcher design complete",
      category: "Hardware",
    },
    {
      date: "Week 48, 2025",
      milestone: "x402 payment protocol live",
      category: "Revenue",
    },
    {
      date: "Week 48, 2025",
      milestone: "10+ ADRs published",
      category: "Architecture",
    },
    {
      date: "Week 48, 2025",
      milestone: "Full RAG integration",
      category: "AI",
    },
    {
      date: "Week 48, 2025",
      milestone: "Market validation - international-first confirmed",
      category: "Strategy",
    },
  ],

  upcoming: [
    {
      target: "Q1 2026",
      milestone: "Net launcher prototype manufactured",
      category: "Hardware",
    },
    {
      target: "Q1 2026",
      milestone: "First EU pilot installation",
      category: "Deployment",
    },
    {
      target: "Q2 2026",
      milestone: "EU regulatory certification",
      category: "Compliance",
    },
    {
      target: "Q3 2026",
      milestone: "Series A funding closed",
      category: "Funding",
    },
    {
      target: "2026",
      milestone: "Canada CUAS Sandbox participation",
      category: "Validation",
    },
  ],
};

/** Deployment Milestones */
export const deploymentMilestones = {
  month6: {
    target: "First operational system deployed",
    status: "target",
  },
  month12: {
    target: "25 systems in field operation",
    status: "target",
  },
  month15: {
    target: "International certification achieved",
    status: "target",
  },
  month18: {
    target: "100+ systems globally deployed",
    status: "target",
  },
};

/** Funding Timeline */
export const fundingTimeline = [
  {
    round: "Seed",
    amount: "$500K-$1M",
    timeline: "Q1-Q2 2026",
    status: "Active",
  },
  {
    round: "Series A",
    amount: "R120M (~$6.7M)",
    timeline: "Q3 2026",
    status: "Planned",
    preconditions: ["Proven revenue", "5 operational installations"],
  },
  {
    round: "Series B",
    amount: "R300M",
    timeline: "Months 12-18",
    status: "Projected",
  },
  {
    round: "Series C",
    amount: "R500M",
    timeline: "Months 24-30",
    status: "Projected",
  },
  {
    round: "Exit/IPO",
    amount: "R2-5B valuation",
    timeline: "Year 5-7",
    status: "Vision",
  },
];

/** Success Metrics */
export const successMetrics = {
  technical: {
    detectionAccuracy: "99%+",
    responseTime: "<200ms",
  },
  commercial: {
    year1Systems: 25,
    year1Revenue: "R25M",
  },
  strategic: {
    internationalPartnerships: 5,
    africanMarkets: 3,
  },
  financial: {
    grossMargin: "65%",
    ebitdaByYear3: "25%",
  },
};

/** Vision */
export const vision = {
  shortTerm: "First EU pilot installation by Q1 2026",
  midTerm: "Global standard for counter-drone defense",
  longTerm: "Expand beyond drones to all autonomous aerial threat defense",
  exitTarget: "IPO candidate with $2.51B+ market and 20%+ market share path",
};
