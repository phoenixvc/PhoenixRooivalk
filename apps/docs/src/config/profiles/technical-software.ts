/**
 * Technical - Software/AI Profile Template
 *
 * For software engineers, AI/ML specialists, and developers
 * focused on technical implementation and system architecture.
 */

import { ProfileTemplate } from "./types";

export const technicalSoftwareTemplate: ProfileTemplate = {
  templateKey: "technical-software",
  templateName: "Software & AI Engineer",
  templateIcon: "💻",
  templateDescription:
    "For software developers and AI/ML specialists working on system implementation",
  name: "Software Engineer",
  roles: ["Technical - Software/AI"],
  focusAreas: ["technical", "research"],
  interests: ["software", "ai", "machine-learning", "counter-uas", "rag", "llm"],
  experienceLevel: "intermediate",
  profileDescription:
    "Software engineer focused on AI/ML systems and autonomous capabilities",
  recommendedPaths: [
    {
      docId: "/docs/technical/technical-architecture",
      title: "Technical Architecture",
      priority: 5,
      reason: "Complete system architecture overview",
    },
    {
      docId: "/docs/technical/ai-ml-integration",
      title: "AI/ML Integration",
      priority: 5,
      reason: "Machine learning pipeline details",
    },
    {
      docId: "/docs/technical/software-architecture",
      title: "Software Architecture",
      priority: 5,
      reason: "Software design patterns and structure",
    },
    {
      docId: "/docs/technical/performance/performance-specifications",
      title: "Performance Specifications",
      priority: 4,
      reason: "System performance metrics",
    },
    {
      docId: "/docs/research/autonomous-systems",
      title: "Autonomous Systems Research",
      priority: 4,
      reason: "R&D on autonomous capabilities",
    },
    {
      docId: "/docs/technical/api-reference",
      title: "API Reference",
      priority: 4,
      reason: "Integration and API documentation",
    },
  ],
};
