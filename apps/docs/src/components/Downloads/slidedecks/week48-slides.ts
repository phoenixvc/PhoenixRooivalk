import type { Slide, KeyPoint } from "../SlideDeckDownload";

/**
 * Week 48 (Nov 25 - Dec 1, 2025) Presentation Slides
 * 3-minute investor feedback meeting presentation
 *
 * Enhanced with:
 * - Rich text formatting (**bold**, *italic*)
 * - Nested sub-bullets for details
 * - Two-column layouts for comparisons
 * - Color theme support
 */
export const week48Slides: Slide[] = [
  {
    number: 1,
    title: "Hardware Progress",
    duration: 30,
    icon: "\u2705",
    keyPoints: [
      {
        text: "Net launcher and net designs **complete** - ready for prototyping",
        subPoints: [
          "Ground-based launcher designed for Grover UGV",
          "Multiple net sizes for different threat levels",
        ],
      },
      {
        text: "In-house Kevlar manufacturing using *Pieter's domestic stock*",
        subPoints: [
          "No import delays or customs issues",
          "Full IP control stays with us",
        ],
      },
      "**60% cost reduction** vs imported materials",
      "Prototype can start *immediately*",
    ],
    speakerNotes:
      "Emphasize the cost savings and speed advantage. The in-house manufacturing is a major competitive advantage.",
    script:
      "Net launcher and net designs are done - ready for prototyping. We're manufacturing Kevlar nets in-house using Pieter's domestic stock. 60% cost reduction, no import delays, IP stays with us. Prototype can start immediately.",
  },
  {
    number: 2,
    title: "Revenue Model",
    duration: 25,
    icon: "\uD83D\uDCB0",
    keyPoints: [
      {
        text: "**x402 payment protocol is live**",
        subPoints: [
          "Blockchain micropayments for API access",
          "Solana + EtherLink integration",
        ],
      },
      "Revenue stream **before hardware ships**",
      "Production-ready with *full security audit passed*",
      {
        text: "Enterprise-ready features",
        subPoints: ["Rate limiting and quotas", "Usage analytics dashboard"],
      },
    ],
    speakerNotes:
      "x402 is our pre-hardware revenue strategy. This de-risks the investment by proving market demand before major hardware spend.",
    script:
      "x402 payment protocol is live - blockchain micropayments for premium API access. Revenue stream before hardware ships. Production-ready with full security.",
  },
  {
    number: 3,
    title: "Market Validation",
    duration: 40,
    icon: "\uD83C\uDFAF",
    layout: "two-column",
    leftColumnTitle: "South Africa Findings",
    leftColumn: [
      "Spoke to **3 SA airports** + Boeing pilot",
      "*Zero* drone incidents recorded",
      "Operators are responsible",
      "Current threats: lasers & kites",
    ],
    rightColumnTitle: "Strategic Pivot",
    rightColumn: [
      "**EU & Canada** have immediate need",
      "Active drone threat incidents",
      "Regulatory frameworks in place",
      "SA becomes *Phase 2* market",
    ],
    keyPoints: [],
    speakerNotes:
      "This market research validated our international-first strategy. SA doesn't have the problem yet, but EU/Canada do.",
    script:
      "Spoke to three SA airports and a Boeing pilot. Finding: SA has zero drone incidents - operators are responsible. Current threats are lasers and kites - cheaper, accessible. This validates our international-first strategy. EU and Canada have the problem today. SA is Phase 2.",
  },
  {
    number: 4,
    title: "Engineering Velocity",
    duration: 20,
    icon: "\uD83D\uDE80",
    keyPoints: [
      "**370+ commits** merged this week",
      "**40+ PRs**, **10+ ADRs** published",
      {
        text: "Full platform integration complete",
        subPoints: [
          "RAG integration for documentation",
          "Authentication & authorization",
          "Gamification system",
          "Monitoring & observability",
        ],
      },
      "Technical foundation is *production-ready*",
    ],
    speakerNotes:
      "These numbers demonstrate exceptional engineering velocity. Each commit is reviewed and tested.",
    script:
      "370+ commits, 40+ PRs, 10+ ADRs. Full RAG integration, auth, gamification. Technical foundation is production-ready.",
  },
  {
    number: 5,
    title: "Key Decisions",
    duration: 20,
    icon: "\uD83D\uDCCB",
    keyPoints: [
      {
        text: "**In-house Kevlar nets**",
        subPoints: ["Cost savings", "Speed to prototype", "IP protection"],
      },
      {
        text: "**International focus** confirmed",
        subPoints: ["Market research validated", "EU/Canada priority"],
      },
      {
        text: "**x402** for pre-hardware revenue",
        subPoints: ["De-risks investment", "Proves market demand"],
      },
      {
        text: "**Firebase Vector Search** selected",
        subPoints: ["Right tool for our stack", "Cost-effective scaling"],
      },
      "*All decisions documented in ADRs*",
    ],
    speakerNotes:
      "Emphasize that every major decision is documented with rationale. This shows mature engineering practices.",
    script:
      "Four key decisions: in-house Kevlar nets, international focus, x402 for pre-hardware revenue, Firebase Vector Search. All documented.",
  },
  {
    number: 6,
    title: "Next Week",
    duration: 15,
    icon: "\uD83D\uDCC5",
    layout: "two-column",
    leftColumnTitle: "Hardware Track",
    leftColumn: [
      "Start net prototype with Pieter's Kevlar",
      "Continue launcher development",
      "Material testing & validation",
    ],
    rightColumnTitle: "Software Track",
    rightColumn: [
      "Continue x402 testing",
      "Begin international outreach",
      "EU/Canada partnership research",
    ],
    keyPoints: [],
    speakerNotes:
      "End with clear next steps. Show that we have a plan and are executing against it.",
    script:
      "Next week: start net prototype, x402 testing, international outreach, continue launcher development. Questions?",
  },
];

export const week48Meta = {
  title: "Week 48 Progress Update",
  duration: 3,
  audience: "Investors/Advisors",
  date: "November 28, 2025",
  colorTheme: "investor" as const,
};
