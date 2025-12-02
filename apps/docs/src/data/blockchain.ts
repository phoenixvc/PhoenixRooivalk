/**
 * Blockchain Specifications
 *
 * Single source of truth for blockchain integration details.
 * IMPORTANT: This file defines the canonical blockchain strategy.
 */

import type { DataPoint, RangeValue } from "./types";

/**
 * Blockchain Strategy
 *
 * CANONICAL APPROACH: Solana as primary chain for evidence anchoring
 * with multi-chain extensibility for future requirements.
 *
 * Note: Some older docs may reference Hedera or EtherLink.
 * The current strategy is Solana-first with optional extensions.
 */
export const blockchainStrategy = {
  approach: "Solana-first with multi-chain extensibility",

  primary: {
    chain: "Solana",
    purpose: "Public evidence anchoring",
    status: "Production",
  },

  secondary: {
    chain: "Private Chain",
    purpose: "Classified operations and sensitive data",
    status: "Planned",
  },

  extensibility: {
    description: "Architecture supports additional chains as needed",
    potentialChains: ["EtherLink", "Hedera", "Polygon"],
    rationale: "Regional compliance, customer requirements",
  },
};

/** Solana Specifications */
export const solana = {
  name: "Solana",
  network: "Mainnet",

  performance: {
    tps: {
      min: 65_000,
      max: 100_000,
      unit: "TPS",
      confidence: "verified",
      notes: "Sustained transaction throughput",
    } as RangeValue,
    formatted: "65,000-100,000 TPS",

    finality: {
      value: 400,
      unit: "ms",
      confidence: "verified",
      notes: "Using Proof of History",
    } as DataPoint,
  },

  costs: {
    perTransaction: {
      value: 0.00025,
      unit: "USD",
      confidence: "verified",
      notes: "Per evidence anchor transaction",
    } as DataPoint,
    formatted: "~$0.00025/tx",

    atScale: {
      description: "Scales to millions of verifications",
      monthlyEstimate: "~$250 for 1M transactions",
    },
  },

  features: {
    proofOfHistory: "Cryptographic clock for ordering",
    parallelProcessing: "Sealevel runtime for parallel transactions",
    lowLatency: "Sub-second finality",
  },
};

/** Evidence Anchoring System */
export const evidenceAnchoring = {
  purpose: "Tamper-proof audit trail for legal defensibility",

  capabilities: [
    "Immutable evidence recording",
    "Cryptographic timestamps",
    "Chain of custody verification",
    "Legal admissibility",
  ],

  dataAnchored: [
    "Detection events",
    "Engagement decisions",
    "Sensor data hashes",
    "Video/image hashes",
    "Action timestamps",
    "Operator authorizations",
  ],

  legalBenefits: {
    admissibility: "Court-ready evidence",
    compliance: "Regulatory audit trails",
    insurance: "Tamper-proof incident documentation",
  },
};

/** x402 Payment Protocol */
export const x402Protocol = {
  name: "x402 Payment Protocol",
  status: "Production (Live)",
  lastUpdate: "Week 48 (Nov 2025)",

  description: "Blockchain micropayments for premium evidence verification API",

  features: {
    micropayments: "Pay-per-verification model",
    rateLimit: "Premium endpoint protection",
    security: "CSRF/M2M protection",
    documentation: "ADR-0016 published",
  },

  pricing: {
    perVerification: {
      min: 0.01,
      max: 0.05,
      unit: "USD",
      notes: "Per tamper-proof timestamp",
    } as RangeValue,
  },

  useCases: [
    {
      industry: "Insurance",
      use: "Drone damage claims require tamper-proof incident footage",
    },
    {
      industry: "Legal",
      use: "Court-admissible evidence chain for prosecution/defense",
    },
    {
      industry: "Regulatory",
      use: "Aviation authority compliance reports (CAA, EASA, FAA)",
    },
  ],

  revenue: {
    preHardware: true,
    description: "Revenue stream active before hardware ships",
  },
};

/** Integration Capabilities */
export const blockchainIntegration = {
  crossChain: {
    capability: "Multi-blockchain support architecture",
    status: "Extensible",
    currentChains: ["Solana"],
    plannedChains: ["Private Chain", "EtherLink"],
  },

  api: {
    type: "REST + WebSocket",
    authentication: "API keys + JWT",
    rateLimit: "Configurable per tier",
  },

  sdk: {
    languages: ["TypeScript", "Rust", "Python"],
    status: "In development",
  },
};

/** Comparison with Legacy References */
export const blockchainLegacyNotes = {
  hedera: {
    status: "Evaluated, not selected as primary",
    reason: "Solana offers better developer ecosystem and tooling",
    mayRevisit: "For specific enterprise requirements",
  },

  etherlink: {
    status: "Mentioned in some docs as secondary",
    current: "Part of multi-chain extensibility, not primary",
  },

  privateChain: {
    status: "Planned for classified operations",
    useCase: "Military/sensitive deployments",
  },
};

/** Summary for documentation */
export function getBlockchainSummary(): string {
  return `Solana blockchain (${solana.performance.formatted}) for tamper-proof evidence anchoring at ${solana.costs.formatted} per transaction`;
}
