/**
 * Internal User Profiles
 *
 * Pre-defined profiles for known internal team members.
 * These profiles are automatically matched by email or display name.
 * Users with internal domain emails are automatically recognized as team members.
 */

import { UserProfile } from "./types";

/**
 * Internal email domains that grant automatic team member recognition.
 * Users with these email domains are automatically granted access to internal templates.
 */
export const INTERNAL_DOMAINS = [
  "phoenixrooivalk.com",
  "justaghost.dev", // Development/admin domain
];

/**
 * Explicit mapping of known internal user email addresses to their profile keys.
 * This allows team members using personal email addresses (like Gmail) to be
 * automatically recognized and assigned their correct profile.
 */
export const KNOWN_INTERNAL_EMAILS: Record<string, string> = {
  "martynrede@gmail.com": "martyn",
  "smit.jurie@gmail.com": "jurie",
  "megatesla@gmail.com": "pieter", // Pieter's personal email
  "eben.mare@gmail.com": "eben",
};

/**
 * Check if an email belongs to an internal domain.
 */
export function isInternalDomain(email?: string | null): boolean {
  if (!email) return false;
  const domain = email.toLowerCase().split("@")[1];
  return INTERNAL_DOMAINS.includes(domain);
}

/**
 * Check if an email is a known internal user email.
 * Returns the profile key if found, null otherwise.
 */
export function getKnownInternalEmail(
  email?: string | null,
): string | null {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();
  return KNOWN_INTERNAL_EMAILS[normalizedEmail] || null;
}

/**
 * Default profile for internal domain users who don't have a specific profile.
 * This grants them access to internal templates while they complete onboarding.
 */
export const DEFAULT_INTERNAL_PROFILE: UserProfile = {
  name: "Team Member",
  roles: ["Technical - Software/AI", "Business"],
  focusAreas: ["technical", "business"],
  interests: ["counter-uas", "strategy"],
  experienceLevel: "intermediate",
  profileDescription:
    "Internal team member with access to all documentation areas",
  recommendedPaths: [
    {
      docId: "/docs/executive/executive-summary",
      title: "Executive Summary",
      priority: 5,
      reason: "Start with the high-level project overview",
    },
    {
      docId: "/docs/technical/technical-architecture",
      title: "Technical Architecture",
      priority: 4,
      reason: "Understand the technical foundation",
    },
    {
      docId: "/docs/business/business-model",
      title: "Business Model",
      priority: 4,
      reason: "Learn about the business strategy",
    },
  ],
};

/**
 * Pre-defined profiles for internal team members.
 * Key is the user identifier (matches against email/displayName).
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

  // Eben - Financial, Business, Executive, Technical - Software/AI
  eben: {
    name: "Eben",
    roles: ["Financial", "Business", "Executive", "Technical - Software/AI"],
    focusAreas: ["executive", "business", "technical", "research"],
    interests: [
      "roi",
      "investment",
      "strategy",
      "compliance",
      "ai",
      "rag",
      "llm",
      "software",
    ],
    experienceLevel: "advanced",
    profileDescription:
      "Financial and business executive with technical expertise in AI/RAG systems, focused on funding, investment, and AI-driven solutions",
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
        docId: "/docs/technical/ai-ml-integration",
        title: "AI/ML Integration",
        priority: 5,
        reason: "Machine learning and RAG system architecture",
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
        docId: "/docs/technical/software-architecture",
        title: "Software Architecture",
        priority: 4,
        reason: "Software design and AI system structure",
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
        docId: "/docs/research/autonomous-systems",
        title: "Autonomous Systems Research",
        priority: 4,
        reason: "R&D on AI and autonomous capabilities",
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
 * Result from getUserProfile with additional metadata
 */
export interface UserProfileResult {
  profile: UserProfile;
  profileKey: string;
  isInternalDomain: boolean;
  matchType: "specific" | "domain" | "name";
}

/**
 * Get user profile by email or display name.
 * Matches against known internal users, then checks for internal domain.
 */
export function getUserProfile(
  email?: string | null,
  displayName?: string | null,
): UserProfile | null {
  const result = getUserProfileWithMetadata(email, displayName);
  return result?.profile ?? null;
}

/**
 * Get user profile with additional metadata about match type.
 * Useful for determining access levels and verification requirements.
 */
export function getUserProfileWithMetadata(
  email?: string | null,
  displayName?: string | null,
): UserProfileResult | null {
  if (!email && !displayName) return null;

  // Normalize inputs
  const normalizedEmail = email?.toLowerCase().trim() || "";
  const normalizedName = displayName?.toLowerCase().trim() || "";
  const isDomainInternal = isInternalDomain(email);

  // Priority 1: Check for exact email match in known internal emails
  // This is the most reliable method for team members using personal emails
  const knownEmailProfileKey = getKnownInternalEmail(email);
  if (knownEmailProfileKey && INTERNAL_USER_PROFILES[knownEmailProfileKey]) {
    return {
      profile: INTERNAL_USER_PROFILES[knownEmailProfileKey],
      profileKey: knownEmailProfileKey,
      isInternalDomain: true, // Treat known emails as internal
      matchType: "specific",
    };
  }

  // Priority 2: Check each profile for name/email pattern matches
  for (const [key, profile] of Object.entries(INTERNAL_USER_PROFILES)) {
    const profileKey = key.toLowerCase();
    const profileName = profile.name.toLowerCase();

    // Match by email containing the key (e.g., "martyn@company.com" matches "martyn")
    if (normalizedEmail.includes(profileKey)) {
      return {
        profile,
        profileKey: key,
        isInternalDomain: isDomainInternal,
        matchType: "specific",
      };
    }

    // Match by display name
    if (
      normalizedName.includes(profileName) ||
      normalizedName.includes(profileKey)
    ) {
      return {
        profile,
        profileKey: key,
        isInternalDomain: isDomainInternal,
        matchType: "name",
      };
    }

    // Match by first name from email (before @)
    const emailName = normalizedEmail.split("@")[0];
    if (emailName === profileKey || emailName.includes(profileKey)) {
      return {
        profile,
        profileKey: key,
        isInternalDomain: isDomainInternal,
        matchType: "specific",
      };
    }
  }

  // Priority 3: Check if user has internal domain (grants default profile)
  if (isDomainInternal) {
    return {
      profile: DEFAULT_INTERNAL_PROFILE,
      profileKey: "internal-domain",
      isInternalDomain: true,
      matchType: "domain",
    };
  }

  return null;
}
