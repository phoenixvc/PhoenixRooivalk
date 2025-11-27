/**
 * Legal Profile Template
 *
 * For legal and compliance specialists
 * focused on regulatory requirements and risk management.
 */

import { ProfileTemplate } from "./types";

export const legalTemplate: ProfileTemplate = {
  templateKey: "legal",
  templateName: "Legal & Compliance",
  templateIcon: "⚖️",
  templateDescription:
    "For legal specialists managing compliance, regulations, and risk",
  name: "Legal Specialist",
  roles: ["Legal"],
  focusAreas: ["legal", "executive"],
  interests: ["compliance", "itar", "defense"],
  experienceLevel: "advanced",
  profileDescription:
    "Legal and compliance specialist focused on regulatory requirements",
  recommendedPaths: [
    {
      docId: "/docs/legal/compliance-framework",
      title: "Compliance Framework",
      priority: 5,
      reason: "Regulatory overview and requirements",
    },
    {
      docId: "/docs/legal/itar-compliance",
      title: "ITAR Compliance",
      priority: 5,
      reason: "Export control regulations",
    },
    {
      docId: "/docs/legal/licensing-requirements",
      title: "Licensing Requirements",
      priority: 5,
      reason: "Operating and export licenses",
    },
    {
      docId: "/docs/legal/ip-protection",
      title: "IP Protection",
      priority: 4,
      reason: "Intellectual property strategy",
    },
    {
      docId: "/docs/executive/executive-summary",
      title: "Executive Summary",
      priority: 3,
      reason: "High-level project overview",
    },
  ],
};
