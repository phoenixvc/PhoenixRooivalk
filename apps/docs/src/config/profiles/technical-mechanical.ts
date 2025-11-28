/**
 * Technical - Mechanical Profile Template
 *
 * For mechanical engineers and hardware specialists
 * focused on platform design and manufacturing.
 */

import { ProfileTemplate } from "./types";

export const technicalMechanicalTemplate: ProfileTemplate = {
  templateKey: "technical-mechanical",
  templateName: "Mechanical Engineer",
  templateIcon: "⚙️",
  templateDescription:
    "For mechanical engineers working on hardware design and platform systems",
  name: "Mechanical Engineer",
  roles: ["Technical - Mechanical"],
  focusAreas: ["technical", "operations"],
  interests: ["hardware", "manufacturing", "defense", "counter-uas"],
  experienceLevel: "intermediate",
  profileDescription:
    "Mechanical engineering specialist focused on hardware and platform design",
  recommendedPaths: [
    {
      docId: "/docs/technical/hardware-foundation",
      title: "Hardware Foundation",
      priority: 5,
      reason: "Core hardware architecture overview",
    },
    {
      docId: "/docs/technical/hardware/rkv-m-specifications",
      title: "RKV-M Specifications",
      priority: 5,
      reason: "Primary platform specifications",
    },
    {
      docId: "/docs/technical/hardware/net-specifications",
      title: "Net Specifications",
      priority: 5,
      reason: "Capture system specifications",
    },
    {
      docId: "/docs/technical/mechanical/mechanical-design-adrs",
      title: "Mechanical Design ADRs",
      priority: 5,
      reason: "Key design decisions and rationale",
    },
    {
      docId: "/docs/technical/mechanical/mechanical-design-records",
      title: "Mechanical Design Records",
      priority: 4,
      reason: "Detailed design documentation",
    },
    {
      docId: "/docs/technical/performance/performance-specifications",
      title: "Performance Specifications",
      priority: 4,
      reason: "Platform performance metrics",
    },
    {
      docId: "/docs/operations/manufacturing-strategy",
      title: "Manufacturing Strategy",
      priority: 3,
      reason: "Manufacturing considerations for hardware",
    },
  ],
};
