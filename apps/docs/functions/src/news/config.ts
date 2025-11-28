/**
 * News Ingestion Configuration
 *
 * Defines news sources, topics, and search queries for AI-powered
 * news retrieval and curation.
 */

/**
 * News topics to search for - these drive the AI search queries
 */
export const NEWS_TOPICS = [
  // Core counter-drone topics
  {
    id: "counter-uas",
    name: "Counter-UAS Technology",
    queries: [
      "counter drone technology news",
      "anti-drone systems developments",
      "C-UAS market news",
      "drone defense technology",
    ],
    category: "counter-uas" as const,
    priority: 1,
  },
  {
    id: "drone-threats",
    name: "Drone Threats & Incidents",
    queries: [
      "drone security incidents",
      "unauthorized drone threats",
      "drone incursions airports military",
      "drone attack defense",
    ],
    category: "counter-uas" as const,
    priority: 1,
  },
  // Defense technology
  {
    id: "defense-autonomy",
    name: "Autonomous Defense Systems",
    queries: [
      "autonomous defense systems news",
      "AI military technology",
      "autonomous weapons developments",
      "defense robotics news",
    ],
    category: "defense-tech" as const,
    priority: 2,
  },
  {
    id: "defense-contracts",
    name: "Defense Contracts & Funding",
    queries: [
      "defense contract awards drone",
      "military drone funding",
      "Pentagon counter-drone budget",
      "defense technology investments",
    ],
    category: "defense-tech" as const,
    priority: 2,
  },
  // Drone industry
  {
    id: "drone-industry",
    name: "Drone Industry News",
    queries: [
      "commercial drone industry news",
      "drone manufacturer developments",
      "UAS industry trends",
      "drone technology innovations",
    ],
    category: "drone-industry" as const,
    priority: 3,
  },
  // Regulatory
  {
    id: "drone-regulations",
    name: "Drone Regulations",
    queries: [
      "FAA drone regulations news",
      "drone airspace regulations",
      "counter-drone legal framework",
      "UAS policy updates",
    ],
    category: "regulatory" as const,
    priority: 2,
  },
  // Market analysis
  {
    id: "market-analysis",
    name: "Market Analysis",
    queries: [
      "counter-drone market analysis",
      "C-UAS market forecast",
      "drone defense market size",
      "anti-drone industry growth",
    ],
    category: "market-analysis" as const,
    priority: 3,
  },
  // Research
  {
    id: "research",
    name: "Research & Development",
    queries: [
      "drone detection research",
      "counter-UAS R&D news",
      "drone interception technology research",
      "academic drone defense studies",
    ],
    category: "research" as const,
    priority: 3,
  },
];

/**
 * Trusted news sources for defense and drone industry
 */
export const NEWS_SOURCES = [
  // Defense industry
  {
    name: "Defense News",
    domain: "defensenews.com",
    trustScore: 0.95,
    categories: ["defense-tech", "counter-uas"],
  },
  {
    name: "Breaking Defense",
    domain: "breakingdefense.com",
    trustScore: 0.9,
    categories: ["defense-tech", "counter-uas"],
  },
  {
    name: "C4ISRNET",
    domain: "c4isrnet.com",
    trustScore: 0.9,
    categories: ["defense-tech", "counter-uas"],
  },
  {
    name: "Janes",
    domain: "janes.com",
    trustScore: 0.95,
    categories: ["defense-tech", "market-analysis"],
  },
  // Drone specific
  {
    name: "DroneLife",
    domain: "dronelife.com",
    trustScore: 0.85,
    categories: ["drone-industry", "regulatory"],
  },
  {
    name: "Commercial UAV News",
    domain: "commercialuavnews.com",
    trustScore: 0.85,
    categories: ["drone-industry", "market-analysis"],
  },
  {
    name: "sUAS News",
    domain: "suasnews.com",
    trustScore: 0.8,
    categories: ["drone-industry", "regulatory"],
  },
  // General tech/business
  {
    name: "Reuters",
    domain: "reuters.com",
    trustScore: 0.95,
    categories: ["defense-tech", "market-analysis"],
  },
  {
    name: "Aviation Week",
    domain: "aviationweek.com",
    trustScore: 0.9,
    categories: ["defense-tech", "drone-industry"],
  },
];

/**
 * Role-to-interest mapping for personalization
 */
export const ROLE_INTERESTS_MAP: Record<string, string[]> = {
  "Technical - Software/AI": [
    "counter-uas",
    "defense-autonomy",
    "research",
    "ai",
    "software",
  ],
  "Technical - Mechanical": [
    "counter-uas",
    "drone-industry",
    "research",
    "hardware",
  ],
  Executive: [
    "defense-contracts",
    "market-analysis",
    "drone-regulations",
    "strategy",
  ],
  Financial: ["market-analysis", "defense-contracts", "roi", "investment"],
  Business: [
    "market-analysis",
    "defense-contracts",
    "drone-industry",
    "strategy",
  ],
  Marketing: ["drone-industry", "market-analysis", "counter-uas"],
  Sales: ["defense-contracts", "market-analysis", "counter-uas"],
  Legal: ["drone-regulations", "compliance", "itar"],
  Operations: ["counter-uas", "drone-threats", "deployment"],
  Research: ["research", "counter-uas", "defense-autonomy"],
  Product: ["counter-uas", "drone-industry", "research"],
  Advisory: ["market-analysis", "defense-contracts", "strategy"],
};

/**
 * Get search queries for a specific role
 */
export function getQueriesForRole(role: string): string[] {
  const interests = ROLE_INTERESTS_MAP[role] || [];
  const queries: string[] = [];

  for (const topic of NEWS_TOPICS) {
    if (interests.includes(topic.id) || interests.includes(topic.category)) {
      queries.push(...topic.queries.slice(0, 2)); // Top 2 queries per topic
    }
  }

  return [...new Set(queries)]; // Deduplicate
}

/**
 * Get all high-priority queries for general news fetch
 */
export function getHighPriorityQueries(): string[] {
  return NEWS_TOPICS.filter((t) => t.priority === 1).flatMap((t) =>
    t.queries.slice(0, 2),
  );
}

/**
 * Get domain filter for trusted sources
 */
export function getTrustedDomains(): string[] {
  return NEWS_SOURCES.map((s) => s.domain);
}
