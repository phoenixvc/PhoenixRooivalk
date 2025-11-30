/**
 * Phoenix Rooivalk Context Definitions
 *
 * Centralized company context for injection into all prompts.
 * This ensures consistent representation across all AI features.
 */

/**
 * Core company context - injected into all prompts
 */
export const PHOENIX_CORE_CONTEXT = `Phoenix Rooivalk is a South African company developing an autonomous reusable kinetic interceptor for counter-UAS defense.

Key differentiators:
- Reusable kinetic vehicle (RKV) system reduces cost-per-engagement
- Blockchain-verified chain of custody for accountability
- AI-powered autonomous targeting with human-in-the-loop options
- Designed for both military and critical infrastructure protection
- Global market ambitions with focus on defense and security sectors`;

/**
 * Technical context - for technical analysis prompts
 */
export const PHOENIX_TECHNICAL_CONTEXT = `Phoenix Rooivalk Technical Specifications:

RKV (Reusable Kinetic Vehicle):
- Autonomous targeting and engagement
- Reusable design for cost efficiency
- Multiple engagement modes (direct, proximity)
- AI-powered threat classification

Sensor Suite:
- Multi-spectral threat detection
- Real-time tracking and prediction
- Integration with existing C-UAS systems

Blockchain System:
- Immutable engagement records
- Chain of custody verification
- Compliance audit trail
- Real-time evidence generation`;

/**
 * Market context - for business/market analysis prompts
 */
export const PHOENIX_MARKET_CONTEXT = `Phoenix Rooivalk Market Position:

Target Markets:
- Military defense installations
- Critical infrastructure (airports, power plants, government)
- Event security (stadiums, public gatherings)
- Border security

Competitive Advantages:
- Lower cost-per-engagement than missiles
- Reusable vs. single-use competitors
- Blockchain accountability (unique differentiator)
- Scalable swarm coordination

Geographic Focus:
- Initial: South Africa, EMEA
- Expansion: North America, Asia-Pacific
- Partnerships: NATO-aligned nations`;

/**
 * Get appropriate context based on prompt category
 */
export function getContextForCategory(
  category: "technical" | "business" | "general",
): string {
  switch (category) {
    case "technical":
      return `${PHOENIX_CORE_CONTEXT}\n\n${PHOENIX_TECHNICAL_CONTEXT}`;
    case "business":
      return `${PHOENIX_CORE_CONTEXT}\n\n${PHOENIX_MARKET_CONTEXT}`;
    default:
      return PHOENIX_CORE_CONTEXT;
  }
}

/**
 * Build RAG context section for prompt injection
 */
export function buildRAGContextSection(
  ragContext: string,
  sources: Array<{ title: string; section: string }>,
): string {
  if (!ragContext || ragContext.trim().length === 0) {
    return "";
  }

  return `
DOCUMENTATION CONTEXT:
The following information is retrieved from Phoenix Rooivalk's official documentation.
Use this to ground your response in accurate, up-to-date information.

${ragContext}

Sources: ${sources.map((s) => `${s.title} (${s.section})`).join(", ")}

IMPORTANT: Reference specific information from the documentation above. If information is not found in the documentation, clearly state that.`;
}
