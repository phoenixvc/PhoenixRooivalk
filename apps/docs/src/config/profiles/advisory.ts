/**
 * Advisory Profile Template
 *
 * For strategic advisors and board members
 * with cross-functional oversight and industry expertise.
 */

import { ProfileTemplate } from "./types";

export const advisoryTemplate: ProfileTemplate = {
  templateKey: "advisory",
  templateName: "Strategic Advisor",
  templateIcon: "🎯",
  templateDescription:
    "For advisors and board members providing strategic guidance",
  name: "Strategic Advisor",
  roles: ["Advisory"],
  focusAreas: ["executive", "business", "technical"],
  interests: ["strategy", "investment", "defense", "counter-uas"],
  experienceLevel: "advanced",
  profileDescription:
    "Strategic advisor with cross-functional oversight and industry expertise",
  recommendedPaths: [
    {
      docId: "/docs/executive/executive-summary",
      title: "Executive Summary",
      priority: 5,
      reason: "High-level project overview",
    },
    {
      docId: "/docs/executive/strategic-recommendations",
      title: "Strategic Recommendations",
      priority: 5,
      reason: "Key strategic guidance",
    },
    {
      docId: "/docs/business/market-analysis",
      title: "Market Analysis",
      priority: 5,
      reason: "Market opportunity assessment",
    },
    {
      docId: "/docs/technical/technical-architecture",
      title: "Technical Architecture",
      priority: 4,
      reason: "Technology capability overview",
    },
    {
      docId: "/docs/business/competitive-analysis",
      title: "Competitive Analysis",
      priority: 4,
      reason: "Competitive landscape",
    },
  ],
};
