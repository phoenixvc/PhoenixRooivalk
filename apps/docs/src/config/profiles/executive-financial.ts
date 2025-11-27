/**
 * Executive & Financial Profile Template
 *
 * For executives, financial analysts, and investors
 * focused on strategic oversight and financial performance.
 */

import { ProfileTemplate } from "./types";

export const executiveFinancialTemplate: ProfileTemplate = {
  templateKey: "executive-financial",
  templateName: "Executive & Finance",
  templateIcon: "💼",
  templateDescription:
    "For executives and financial professionals managing strategy and investments",
  name: "Executive",
  roles: ["Executive", "Financial"],
  focusAreas: ["executive", "business"],
  interests: ["roi", "investment", "strategy", "compliance"],
  experienceLevel: "advanced",
  profileDescription:
    "Executive and financial leader focused on strategic oversight and investment",
  recommendedPaths: [
    {
      docId: "/docs/executive/executive-summary",
      title: "Executive Summary",
      priority: 5,
      reason: "High-level project overview",
    },
    {
      docId: "/docs/executive/investor-executive-summary",
      title: "Investor Summary",
      priority: 5,
      reason: "Key document for investor communications",
    },
    {
      docId: "/docs/business/financial-projections",
      title: "Financial Projections",
      priority: 5,
      reason: "Core financial planning and forecasts",
    },
    {
      docId: "/docs/business/roi-analysis",
      title: "ROI Analysis",
      priority: 5,
      reason: "Return on investment metrics",
    },
    {
      docId: "/docs/business/business-model",
      title: "Business Model",
      priority: 5,
      reason: "Revenue and cost structure",
    },
    {
      docId: "/docs/business/12-month-business-plan",
      title: "12-Month Business Plan",
      priority: 4,
      reason: "Strategic roadmap and milestones",
    },
    {
      docId: "/docs/executive/phoenix-rooivalk-pitch-deck",
      title: "Pitch Deck",
      priority: 4,
      reason: "Investor presentation materials",
    },
    {
      docId: "/docs/business/funding-requirements",
      title: "Funding Requirements",
      priority: 4,
      reason: "Capital needs and use of funds",
    },
  ],
};
