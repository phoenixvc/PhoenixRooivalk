/**
 * Business & Marketing Profile Template
 *
 * For business development, marketing, and sales professionals
 * focused on market positioning and customer engagement.
 */

import { ProfileTemplate } from "./types";

export const businessMarketingTemplate: ProfileTemplate = {
  templateKey: "business-marketing",
  templateName: "Business & Marketing",
  templateIcon: "📈",
  templateDescription:
    "For marketing, sales, and business development professionals",
  name: "Business Professional",
  roles: ["Business", "Marketing", "Sales"],
  focusAreas: ["business", "executive"],
  interests: ["market-analysis", "commercial", "strategy", "counter-uas", "roi"],
  experienceLevel: "intermediate",
  profileDescription:
    "Business and marketing professional focused on market positioning and growth",
  recommendedPaths: [
    {
      docId: "/docs/business/competitive-differentiation-guide",
      title: "Competitive Differentiation",
      priority: 5,
      reason: "Key selling points and positioning",
    },
    {
      docId: "/docs/business/use-cases",
      title: "Use Cases",
      priority: 5,
      reason: "Customer application scenarios",
    },
    {
      docId: "/docs/executive/phoenix-rooivalk-pitch-deck",
      title: "Pitch Deck",
      priority: 5,
      reason: "Sales and presentation materials",
    },
    {
      docId: "/docs/business/market-analysis",
      title: "Market Analysis",
      priority: 5,
      reason: "Market opportunity understanding",
    },
    {
      docId: "/docs/business/commercial-proposal-template",
      title: "Commercial Proposal Template",
      priority: 5,
      reason: "Template for customer proposals",
    },
    {
      docId: "/docs/business/discovery-questionnaire",
      title: "Discovery Questionnaire",
      priority: 4,
      reason: "Customer needs assessment",
    },
    {
      docId: "/docs/business/traction-metrics",
      title: "Traction Metrics",
      priority: 4,
      reason: "Key metrics for sales conversations",
    },
    {
      docId: "/docs/business/roi-analysis",
      title: "ROI Analysis",
      priority: 4,
      reason: "Value proposition and returns",
    },
  ],
};
