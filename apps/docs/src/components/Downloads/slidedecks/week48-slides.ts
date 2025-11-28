import type { Slide } from "../SlideDeckDownload";

/**
 * Week 48 (Nov 25 - Dec 1, 2025) Presentation Slides
 * 3-minute investor feedback meeting presentation
 */
export const week48Slides: Slide[] = [
  {
    number: 1,
    title: "Hardware Progress",
    duration: 30,
    icon: "\u2705",
    keyPoints: [
      "Net launcher and net designs complete - ready for prototyping",
      "In-house Kevlar manufacturing using Pieter's domestic stock",
      "60% cost reduction, no import delays, IP stays with us",
      "Prototype can start immediately",
    ],
    script:
      "Net launcher and net designs are done - ready for prototyping. We're manufacturing Kevlar nets in-house using Pieter's domestic stock. 60% cost reduction, no import delays, IP stays with us. Prototype can start immediately.",
  },
  {
    number: 2,
    title: "Revenue Model",
    duration: 25,
    icon: "\uD83D\uDCB0",
    keyPoints: [
      "x402 payment protocol is live",
      "Blockchain micropayments for premium API access",
      "Revenue stream before hardware ships",
      "Production-ready with full security",
    ],
    script:
      "x402 payment protocol is live - blockchain micropayments for premium API access. Revenue stream before hardware ships. Production-ready with full security.",
  },
  {
    number: 3,
    title: "Market Validation",
    duration: 40,
    icon: "\uD83C\uDFAF",
    keyPoints: [
      "Spoke to three SA airports and a Boeing pilot",
      "Finding: SA has zero drone incidents - operators are responsible",
      "Current threats are lasers and kites - cheaper, accessible",
      "Validates international-first strategy (EU and Canada)",
      "SA is Phase 2 market",
    ],
    script:
      "Spoke to three SA airports and a Boeing pilot. Finding: SA has zero drone incidents - operators are responsible. Current threats are lasers and kites - cheaper, accessible. This validates our international-first strategy. EU and Canada have the problem today. SA is Phase 2.",
  },
  {
    number: 4,
    title: "Engineering Velocity",
    duration: 20,
    icon: "\uD83D\uDE80",
    keyPoints: [
      "370+ commits merged this week",
      "40+ PRs, 10+ ADRs published",
      "Full RAG integration, auth, gamification",
      "Technical foundation is production-ready",
    ],
    script:
      "370+ commits, 40+ PRs, 10+ ADRs. Full RAG integration, auth, gamification. Technical foundation is production-ready.",
  },
  {
    number: 5,
    title: "Key Decisions",
    duration: 20,
    icon: "\uD83D\uDCCB",
    keyPoints: [
      "In-house Kevlar nets - cost, speed, IP protection",
      "International focus - market research confirmed",
      "x402 for pre-hardware revenue",
      "Firebase Vector Search - right tool for stack",
      "All decisions documented in ADRs",
    ],
    script:
      "Four key decisions: in-house Kevlar nets, international focus, x402 for pre-hardware revenue, Firebase Vector Search. All documented.",
  },
  {
    number: 6,
    title: "Next Week",
    duration: 15,
    icon: "\uD83D\uDCC5",
    keyPoints: [
      "Start net prototype with Pieter's Kevlar",
      "Continue x402 testing",
      "Begin international outreach (EU/Canada)",
      "Continue launcher development",
    ],
    script:
      "Next week: start net prototype, x402 testing, international outreach, continue launcher development. Questions?",
  },
];

export const week48Meta = {
  title: "Week 48 Progress Update",
  duration: 3,
  audience: "Investors/Advisors",
  date: "November 28, 2025",
};
