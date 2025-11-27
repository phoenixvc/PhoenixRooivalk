/**
 * User Profiles Configuration
 *
 * Pre-defined user profile templates for internal team members.
 * Maps user emails to their focus areas and recommended documentation paths.
 *
 * These serve as templates that can be extended with public profile information.
 */

export interface UserProfile {
  name: string;
  roles: string[]; // Job functions (e.g., "Business", "Technical - Mechanical")
  focusAreas: string[]; // Documentation categories (e.g., "executive", "technical")
  interests: string[]; // Specific topics of interest (e.g., "ROI", "hardware", "AI")
  experienceLevel: "beginner" | "intermediate" | "advanced"; // For doc difficulty matching
  recommendedPaths: RecommendedPath[];
  profileDescription: string;
}

export interface RecommendedPath {
  docId: string;
  title: string;
  priority: number; // 1-5, higher = more important
  reason: string;
}

/**
 * Available role options for profile selection
 */
export const AVAILABLE_ROLES = [
  "Founder",
  "Lead",
  "Business",
  "Marketing",
  "Sales",
  "Financial",
  "Executive",
  "Technical - Mechanical",
  "Technical - Software/AI",
  "Operations",
  "Legal",
  "Research",
  "Advisory",
  "Product",
] as const;

/**
 * Available interest tags matching frontmatter tags
 */
export const AVAILABLE_INTERESTS = [
  "counter-uas",
  "hardware",
  "software",
  "ai",
  "machine-learning",
  "compliance",
  "itar",
  "defense",
  "commercial",
  "roi",
  "investment",
  "manufacturing",
  "deployment",
  "strategy",
  "market-analysis",
] as const;

/**
 * Pre-defined profiles for internal team members.
 * Key is the user's email (lowercase).
 */
export const INTERNAL_USER_PROFILES: Record<string, UserProfile> = {
  // Martyn - Business, Marketing, Technical-Mechanical
  martyn: {
    name: "Martyn",
    roles: ["Business", "Marketing", "Technical - Mechanical"],
    focusAreas: ["business", "executive", "technical"],
    interests: ["market-analysis", "strategy", "hardware", "roi", "commercial"],
    experienceLevel: "advanced",
    profileDescription:
      "Business strategist with marketing expertise and mechanical systems understanding",
    recommendedPaths: [
      {
        docId: "/docs/business/market-analysis",
        title: "Market Analysis",
        priority: 5,
        reason: "Core market understanding for business strategy",
      },
      {
        docId: "/docs/business/competitive-analysis",
        title: "Competitive Analysis",
        priority: 5,
        reason: "Essential for marketing positioning",
      },
      {
        docId: "/docs/executive/investor-executive-summary",
        title: "Investor Summary",
        priority: 4,
        reason: "Key document for investor communications",
      },
      {
        docId: "/docs/business/business-model",
        title: "Business Model",
        priority: 4,
        reason: "Foundation for business development",
      },
      {
        docId: "/docs/technical/hardware-foundation",
        title: "Hardware Foundation",
        priority: 3,
        reason: "Technical understanding of mechanical systems",
      },
      {
        docId: "/docs/business/roi-analysis",
        title: "ROI Analysis",
        priority: 4,
        reason: "Key metrics for business cases",
      },
      {
        docId: "/docs/executive/phoenix-rooivalk-pitch-deck",
        title: "Pitch Deck",
        priority: 5,
        reason: "Essential for marketing and investor presentations",
      },
      {
        docId: "/docs/technical/hardware/rkv-m-specifications",
        title: "RKV-M Specifications",
        priority: 3,
        reason: "Mechanical platform specifications",
      },
    ],
  },

  // Pieter - Technical-Mechanical
  pieter: {
    name: "Pieter",
    roles: ["Technical - Mechanical"],
    focusAreas: ["technical"],
    interests: ["hardware", "manufacturing", "defense", "counter-uas"],
    experienceLevel: "advanced",
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
        docId: "/docs/technical/defense-technology-deep-dive",
        title: "Defense Technology Deep Dive",
        priority: 4,
        reason: "Advanced defense system details",
      },
      {
        docId: "/docs/operations/manufacturing-strategy",
        title: "Manufacturing Strategy",
        priority: 3,
        reason: "Manufacturing considerations for hardware",
      },
    ],
  },

  // Jurie - Everything (founder/lead)
  jurie: {
    name: "Jurie",
    roles: ["Founder", "Lead", "Technical - Software/AI"],
    focusAreas: [
      "executive",
      "technical",
      "business",
      "operations",
      "legal",
      "research",
    ],
    interests: [
      "counter-uas",
      "ai",
      "software",
      "strategy",
      "investment",
      "defense",
    ],
    experienceLevel: "advanced",
    profileDescription:
      "Project lead with full oversight across all documentation areas",
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
        reason: "Investor-ready documentation",
      },
      {
        docId: "/docs/technical/technical-architecture",
        title: "Technical Architecture",
        priority: 5,
        reason: "Complete technical overview",
      },
      {
        docId: "/docs/business/12-month-business-plan",
        title: "12-Month Business Plan",
        priority: 5,
        reason: "Strategic roadmap and milestones",
      },
      {
        docId: "/docs/resources/documentation-status",
        title: "Documentation Status",
        priority: 4,
        reason: "Track documentation completeness",
      },
      {
        docId: "/docs/executive/strategic-recommendations",
        title: "Strategic Recommendations",
        priority: 4,
        reason: "Key strategic guidance",
      },
      {
        docId: "/docs/legal/compliance-framework",
        title: "Compliance Framework",
        priority: 4,
        reason: "Regulatory and legal overview",
      },
      {
        docId: "/docs/operations/implementation-plan",
        title: "Implementation Plan",
        priority: 4,
        reason: "Execution roadmap",
      },
    ],
  },

  // Chanelle - Marketing, Sales
  chanelle: {
    name: "Chanelle",
    roles: ["Marketing", "Sales"],
    focusAreas: ["business", "executive"],
    interests: ["market-analysis", "commercial", "strategy", "counter-uas"],
    experienceLevel: "intermediate",
    profileDescription:
      "Marketing and sales specialist focused on market positioning and customer engagement",
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
        reason: "Sales presentation materials",
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
        docId: "/docs/business/influencers-and-contacts",
        title: "Influencers and Contacts",
        priority: 4,
        reason: "Industry contacts and networking",
      },
      {
        docId: "/docs/executive/presentation-materials",
        title: "Presentation Materials",
        priority: 4,
        reason: "Additional presentation resources",
      },
      {
        docId: "/docs/operations/customer-onboarding-guide",
        title: "Customer Onboarding",
        priority: 3,
        reason: "Post-sale customer success",
      },
    ],
  },

  // Eben - Financial, Business, Executive
  eben: {
    name: "Eben",
    roles: ["Financial", "Business", "Executive"],
    focusAreas: ["executive", "business"],
    interests: ["roi", "investment", "strategy", "compliance"],
    experienceLevel: "advanced",
    profileDescription:
      "Financial and business executive focused on funding, investment, and strategic planning",
    recommendedPaths: [
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
        docId: "/docs/executive/executive-summary",
        title: "Executive Summary",
        priority: 5,
        reason: "High-level project overview",
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
        priority: 5,
        reason: "Capital needs and use of funds",
      },
      {
        docId: "/docs/business/traction-metrics",
        title: "Traction Metrics",
        priority: 4,
        reason: "Key performance indicators",
      },
      {
        docId: "/docs/legal/compliance-framework",
        title: "Compliance Framework",
        priority: 3,
        reason: "Regulatory and legal considerations",
      },
    ],
  },
};

/**
 * Profile Templates for role-based recommendations
 * These can be used for new users who select roles but don't have pre-defined profiles
 */
export const PROFILE_TEMPLATES: Record<string, Partial<UserProfile>> = {
  // Technical - Software/AI template
  "technical-software": {
    roles: ["Technical - Software/AI"],
    focusAreas: ["technical", "research"],
    interests: ["software", "ai", "machine-learning", "counter-uas"],
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
  },

  // Operations template
  operations: {
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
  },

  // Legal/Compliance template
  legal: {
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
  },

  // Advisory template
  advisory: {
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
  },
};

/**
 * Get user profile by email or display name.
 * Matches against known internal users.
 */
export function getUserProfile(
  email?: string | null,
  displayName?: string | null,
): UserProfile | null {
  if (!email && !displayName) return null;

  // Normalize inputs
  const normalizedEmail = email?.toLowerCase().trim() || "";
  const normalizedName = displayName?.toLowerCase().trim() || "";

  // Check each profile for a match
  for (const [key, profile] of Object.entries(INTERNAL_USER_PROFILES)) {
    const profileKey = key.toLowerCase();
    const profileName = profile.name.toLowerCase();

    // Match by email containing the key (e.g., "martyn@company.com" matches "martyn")
    if (normalizedEmail.includes(profileKey)) {
      return profile;
    }

    // Match by display name
    if (
      normalizedName.includes(profileName) ||
      normalizedName.includes(profileKey)
    ) {
      return profile;
    }

    // Match by first name from email (before @)
    const emailName = normalizedEmail.split("@")[0];
    if (emailName === profileKey || emailName.includes(profileKey)) {
      return profile;
    }
  }

  return null;
}

/**
 * Get recommended paths for a user, sorted by priority.
 */
export function getRecommendedPaths(profile: UserProfile): RecommendedPath[] {
  return [...profile.recommendedPaths].sort((a, b) => b.priority - a.priority);
}

/**
 * Convert profile to AI-compatible recommendation format.
 */
export function profileToRecommendations(
  profile: UserProfile,
  maxItems: number = 5,
): Array<{ docId: string; relevanceScore: number; reason: string }> {
  const paths = getRecommendedPaths(profile).slice(0, maxItems);

  return paths.map((path) => ({
    docId: path.docId,
    relevanceScore: path.priority / 5, // Normalize to 0-1
    reason: path.reason,
  }));
}

/**
 * Category definitions with their doc path prefixes.
 */
export const CATEGORY_PATHS: Record<string, string[]> = {
  executive: ["/docs/executive/"],
  technical: ["/docs/technical/"],
  business: ["/docs/business/"],
  operations: ["/docs/operations/"],
  legal: ["/docs/legal/"],
  research: ["/docs/research/"],
  resources: ["/docs/resources/"],
};

/**
 * Get category from a doc path.
 */
export function getCategoryFromDocPath(docPath: string): string | null {
  for (const [category, prefixes] of Object.entries(CATEGORY_PATHS)) {
    if (prefixes.some((prefix) => docPath.startsWith(prefix))) {
      return category;
    }
  }
  return null;
}
