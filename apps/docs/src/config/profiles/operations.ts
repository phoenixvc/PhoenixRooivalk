/**
 * Operations Profile Template
 *
 * For operations managers and field specialists
 * focused on deployment, manufacturing, and field operations.
 */

import { ProfileTemplate } from "./types";

export const operationsTemplate: ProfileTemplate = {
  templateKey: "operations",
  templateName: "Operations Manager",
  templateIcon: "🔧",
  templateDescription:
    "For operations specialists managing deployment, manufacturing, and field work",
  name: "Operations Specialist",
  roles: ["Operations"],
  focusAreas: ["operations", "technical"],
  interests: ["deployment", "manufacturing", "counter-uas"],
  experienceLevel: "intermediate",
  profileDescription:
    "Operations specialist focused on deployment, manufacturing, and field operations",
  recommendedPaths: [
    {
      docId: "/docs/operations/implementation-plan",
      title: "Implementation Plan",
      priority: 5,
      reason: "Deployment and execution roadmap",
    },
    {
      docId: "/docs/operations/manufacturing-strategy",
      title: "Manufacturing Strategy",
      priority: 5,
      reason: "Production and supply chain",
    },
    {
      docId: "/docs/operations/field-operations-manual",
      title: "Field Operations Manual",
      priority: 5,
      reason: "On-ground operational procedures",
    },
    {
      docId: "/docs/operations/customer-onboarding-guide",
      title: "Customer Onboarding",
      priority: 4,
      reason: "Customer deployment process",
    },
    {
      docId: "/docs/operations/maintenance-procedures",
      title: "Maintenance Procedures",
      priority: 4,
      reason: "System maintenance and upkeep",
    },
    {
      docId: "/docs/technical/hardware-foundation",
      title: "Hardware Foundation",
      priority: 3,
      reason: "Hardware understanding for operations",
    },
  ],
};
