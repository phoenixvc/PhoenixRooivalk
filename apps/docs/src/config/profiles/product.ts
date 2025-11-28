/**
 * Product Profile Template
 *
 * For product managers and product owners
 * focused on product development and roadmap.
 */

import { ProfileTemplate } from "./types";

export const productTemplate: ProfileTemplate = {
  templateKey: "product",
  templateName: "Product Manager",
  templateIcon: "📦",
  templateDescription:
    "For product managers overseeing product development and roadmap",
  name: "Product Manager",
  roles: ["Product"],
  focusAreas: ["business", "technical", "executive"],
  interests: ["strategy", "counter-uas", "commercial", "software"],
  experienceLevel: "intermediate",
  profileDescription:
    "Product manager focused on product development and customer needs",
  recommendedPaths: [
    {
      docId: "/docs/executive/executive-summary",
      title: "Executive Summary",
      priority: 5,
      reason: "Product vision and overview",
    },
    {
      docId: "/docs/business/use-cases",
      title: "Use Cases",
      priority: 5,
      reason: "Customer scenarios and requirements",
    },
    {
      docId: "/docs/technical/technical-architecture",
      title: "Technical Architecture",
      priority: 5,
      reason: "System capabilities and constraints",
    },
    {
      docId: "/docs/business/competitive-differentiation-guide",
      title: "Competitive Differentiation",
      priority: 4,
      reason: "Product positioning and value props",
    },
    {
      docId: "/docs/business/12-month-business-plan",
      title: "12-Month Business Plan",
      priority: 4,
      reason: "Product roadmap alignment",
    },
    {
      docId: "/docs/technical/performance/performance-specifications",
      title: "Performance Specifications",
      priority: 4,
      reason: "Product performance metrics",
    },
    {
      docId: "/docs/operations/customer-onboarding-guide",
      title: "Customer Onboarding",
      priority: 3,
      reason: "Customer experience and success",
    },
  ],
};
