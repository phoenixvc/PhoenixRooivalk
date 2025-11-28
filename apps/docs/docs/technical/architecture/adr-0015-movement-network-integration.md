---
id: adr-0015-movement-network-integration
title: "ADR 0015: Movement Network (MoveNet) Integration Evaluation"
sidebar_label: "ADR 0015: Movement Network"
difficulty: expert
estimated_reading_time: 8
points: 50
tags:
  - technical
  - architecture
  - blockchain
  - movement
  - move-language
  - evidence-anchoring
prerequisites:
  - architecture-decision-records
  - adr-0001-chain-selection
---

# ADR 0015: Movement Network (MoveNet) Integration Evaluation

**Date**: 2025-11-28 **Status**: Proposed (Hackathon Pilot Recommended)

---

## Executive Summary

1. **Problem**: Should we expand our blockchain anchoring strategy to include
   Movement Network (M1)?
2. **Decision**: Pursue a pilot integration via the Movement M1 Hackathon
   (December 2025) as a third-chain option
3. **Trade-off**: New network maturity risk vs. Move language's exceptional
   security model for evidence records

---

## Context

### Current Blockchain Architecture

Phoenix Rooivalk currently uses dual-chain anchoring for evidence management:

| Chain         | Role                 | Performance                              | Status     |
| ------------- | -------------------- | ---------------------------------------- | ---------- |
| **Solana**    | Primary anchoring    | 65,000 TPS, ~400ms finality, $0.00025/tx | Production |
| **EtherLink** | Secondary/redundancy | Ethereum L2 compatibility                | Production |

Per
[ADR 0001](./architecture-decision-records#adr-0001-chain-selection-for-on-chain-anchoring-solana-vs-others)
and
[ADR-D002](./architecture-decision-records#adr-d002-dual-blockchain-anchoring-solana--etherlink),
our strategy emphasizes:

- Low-latency finality for real-time operations
- Cost-efficient frequent anchoring
- Multi-chain redundancy for legal defensibility
- Tamper-evident audit trails for court admissibility

### What is Movement Network?

**Movement Network** is a next-generation Layer 1 blockchain built around the
**Move programming language** and **MoveVM**. Key characteristics:

| Feature              | Description                                                                   |
| -------------------- | ----------------------------------------------------------------------------- |
| **Language**         | Move (resource-oriented, developed by Facebook/Meta for Libra/Diem)           |
| **VM**               | MoveVM with EVM compatibility (supports Solidity bytecode)                    |
| **Performance**      | Exceptionally high TPS, near-instant finality                                 |
| **Architecture**     | Modular with Move Executor, decentralized sequencer, fast finality settlement |
| **Interoperability** | Cross-chain transactions, shared liquidity, multi-asset staking               |
| **Token**            | MOVE (governance, staking, economic activities)                               |

### Opportunity: Movement M1 Hackathon

**Movement M1 Hackathon** (organized by Encode Club + Move Industries):

- **Start Date**: December 1, 2025
- **Duration**: 4 weeks
- **Focus**: Building real products on Movement's M1 blockchain
- **Prizes**: $30,000 total
- **Target**: Intermediate developers, emphasis on speed-to-ship

This presents a low-risk opportunity to pilot Movement integration.

---

## Options Considered

### Option 1: No Integration ❌

Continue with current Solana + EtherLink dual-chain strategy.

**Pros**:

- No additional complexity
- Proven, battle-tested chains
- Existing tooling and expertise

**Cons**:

- Miss opportunity to leverage Move's security model
- No exposure to emerging L1 ecosystem
- Potential competitive disadvantage if Movement gains defense sector adoption

---

### Option 2: Replace Solana with Movement ❌

Migrate primary anchoring from Solana to Movement Network.

**Pros**:

- Potentially superior security model (Move resources)
- Modern architecture with native EVM compatibility

**Cons**:

- **High Risk**: Movement is newer, less battle-tested
- Migration complexity and cost
- Loss of Solana ecosystem benefits
- Insufficient production data on reliability

---

### Option 3: Hackathon Pilot as Third Chain ✅ Recommended

Add Movement as a **third-chain option** via hackathon pilot, maintaining
Solana + EtherLink.

**Pros**:

- Low-risk exploration of Move language benefits
- Hackathon provides mentorship and ecosystem support
- Can validate performance claims before production commitment
- No disruption to existing production chains
- Potential prize funding ($30,000)

**Cons**:

- Engineering effort for pilot
- Learning curve for Move language
- May not reach production if Movement ecosystem doesn't mature

---

## Decision

**Pursue Option 3: Hackathon Pilot as Third Chain**

Develop a proof-of-concept Movement Network integration during the M1 Hackathon
(December 2025), evaluating Movement as a potential third-chain option for
evidence anchoring.

---

## Rationale

### Why Movement Adds Value

#### 1. Move Language Security Model

The Move programming language offers a **resource-oriented paradigm** that is
exceptionally well-suited for evidence records:

```move
// Move resources cannot be copied, only moved
// Perfect for immutable evidence semantics
module phoenix_evidence::evidence {
    use std::string::String;

    // Resource type - linear types ensure single ownership
    struct EvidenceRecord has key, store {
        id: vector<u8>,
        digest_sha256: vector<u8>,
        timestamp: u64,
        metadata: String,
        // Once created, cannot be duplicated or forged
    }

    // Anchor confirmation is a separate resource
    struct ChainAnchor has key, store {
        evidence_id: vector<u8>,
        tx_hash: vector<u8>,
        block_height: u64,
        confirmed: bool,
    }

    // Resource safety: evidence cannot be accidentally lost or duplicated
    public fun create_evidence(
        creator: &signer,
        id: vector<u8>,
        digest: vector<u8>,
        metadata: String,
    ) {
        let record = EvidenceRecord {
            id,
            digest_sha256: digest,
            timestamp: timestamp::now_seconds(),
            metadata,
        };
        move_to(creator, record);
    }
}
```

**Key Security Benefits**:

| Feature                 | Benefit for Evidence                                  |
| ----------------------- | ----------------------------------------------------- |
| **Linear Types**        | Evidence records cannot be duplicated or forged       |
| **Resource Safety**     | Cannot accidentally lose or destroy evidence          |
| **Formal Verification** | Move Prover enables mathematical proof of correctness |
| **No Reentrancy**       | Immune to entire classes of smart contract exploits   |
| **Explicit Ownership**  | Clear chain of custody in code                        |

#### 2. Performance Alignment

| Metric       | Solana (Current) | Movement (Claimed)   | Phoenix Requirement |
| ------------ | ---------------- | -------------------- | ------------------- |
| **TPS**      | 65,000           | "Exceptionally high" | >1,000              |
| **Finality** | ~400ms           | "Near-instant"       | <2 seconds          |
| **Cost/tx**  | $0.00025         | Competitive          | <$0.01              |

Movement claims to meet or exceed our performance requirements, pending
validation.

#### 3. EVM Compatibility

Movement's dual MoveVM/EVM support creates potential synergies:

```
┌─────────────────────────────────────────────────────────┐
│                Phoenix Evidence System                   │
├─────────────────┬─────────────────┬─────────────────────┤
│   Solana        │   EtherLink     │   Movement          │
│   (Primary)     │   (Ethereum L2) │   (Move + EVM)      │
│                 │                 │                     │
│   Memo Program  │   EVM Contract  │   Move Module OR    │
│   anchoring     │   anchoring     │   EVM Contract      │
└─────────────────┴─────────────────┴─────────────────────┘
                          │
                          ▼
                  Unified Evidence API
                  (AnchorProvider trait)
```

**Bridge Potential**: Movement's EVM compatibility could enable:

- Reuse of EtherLink contract code
- Cross-chain verification with Ethereum ecosystem
- Unified tooling for EVM-based chains

#### 4. Strategic Positioning

| Factor               | Consideration                                                                       |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Defense Sector**   | If Movement gains adoption in government/defense, early integration is advantageous |
| **Compliance**       | Move's formal verification aligns with military audit requirements                  |
| **Innovation**       | Demonstrates Phoenix Rooivalk's commitment to cutting-edge technology               |
| **Ecosystem Growth** | Movement is actively growing developer community                                    |

---

## Implementation Plan

### Phase 1: Hackathon Pilot (December 2025)

**Scope**: 4-week sprint to build proof-of-concept

| Week       | Deliverable                                                   |
| ---------- | ------------------------------------------------------------- |
| **Week 1** | Move language fundamentals, Movement SDK setup, module design |
| **Week 2** | Implement `EvidenceRecord` and `ChainAnchor` Move modules     |
| **Week 3** | Create `MovementProvider` implementing `AnchorProvider` trait |
| **Week 4** | Integration testing, demo, hackathon submission               |

**Technical Deliverables**:

1. **Move Module**: `phoenix_evidence` module on Movement testnet
2. **Rust Provider**: `anchor-movement` crate implementing `AnchorProvider`
3. **Integration**: Wire into existing keeper service
4. **Documentation**: Performance benchmarks and comparison

```rust
// New crate: crates/anchor-movement/src/lib.rs
use async_trait::async_trait;
use phoenix_evidence::anchor::{AnchorError, AnchorProvider};
use phoenix_evidence::model::{ChainTxRef, EvidenceRecord};

pub struct MovementProvider {
    client: MovementClient,
    network: String,
}

#[async_trait]
impl AnchorProvider for MovementProvider {
    async fn anchor(&self, evidence: &EvidenceRecord)
        -> Result<ChainTxRef, AnchorError> {
        // Submit Move transaction to anchor evidence
        let tx_hash = self.client
            .submit_evidence_anchor(&evidence.digest.hex)
            .await?;

        Ok(ChainTxRef {
            network: "movement".to_string(),
            chain: self.network.clone(),
            tx_id: tx_hash,
            confirmed: false,
            timestamp: Some(Utc::now()),
        })
    }

    async fn confirm(&self, tx: &ChainTxRef)
        -> Result<ChainTxRef, AnchorError> {
        // Query Movement for transaction status
        let status = self.client
            .get_transaction_status(&tx.tx_id)
            .await?;

        Ok(ChainTxRef {
            confirmed: status.is_finalized,
            ..tx.clone()
        })
    }
}
```

### Phase 2: Evaluation (January 2026)

| Criteria                 | Target                  | Measurement                 |
| ------------------------ | ----------------------- | --------------------------- |
| **Latency**              | <500ms anchor + confirm | End-to-end timing           |
| **Reliability**          | >99% success rate       | Transaction success/failure |
| **Cost**                 | <$0.001/tx              | Gas fee analysis            |
| **Developer Experience** | Comparable to Solana    | Team feedback               |
| **Network Stability**    | <1% downtime            | Monitoring                  |

### Phase 3: Production Decision (Q1 2026)

Based on pilot results:

| Outcome      | Action                                                   |
| ------------ | -------------------------------------------------------- |
| **Positive** | Add Movement as third production chain                   |
| **Neutral**  | Monitor Movement ecosystem maturity, revisit in 6 months |
| **Negative** | Document learnings, close pilot                          |

---

## Risks and Mitigations

| Risk                        | Likelihood | Impact | Mitigation                                  |
| --------------------------- | ---------- | ------ | ------------------------------------------- |
| **Network Immaturity**      | Medium     | High   | Pilot only, no production dependency        |
| **Move Learning Curve**     | Medium     | Medium | Hackathon mentorship, 4-week scope          |
| **Ecosystem Uncertainty**   | Medium     | Medium | Non-blocking; Solana remains primary        |
| **Hackathon Time Conflict** | Low        | Medium | Scope to evidence anchoring only            |
| **Integration Complexity**  | Low        | Low    | `AnchorProvider` abstraction already exists |

---

## Cost Analysis

### Hackathon Pilot Investment

| Item                              | Estimate          |
| --------------------------------- | ----------------- |
| Engineering time (4 weeks, 1 dev) | ~R80,000 ($4,300) |
| Movement testnet (free)           | $0                |
| Tooling/infrastructure            | Minimal           |
| **Total Investment**              | ~R80,000 ($4,300) |

### Potential Returns

| Outcome                  | Value                                  |
| ------------------------ | -------------------------------------- |
| Hackathon prize (if won) | Up to $30,000                          |
| Third-chain redundancy   | Enhanced evidence resilience           |
| Move expertise           | Applicable to Aptos, Sui ecosystems    |
| Competitive positioning  | First-mover in Move-based defense tech |

---

## Consequences

### Positive

- **Low-Risk Exploration**: Hackathon provides structured, time-boxed evaluation
- **Security Innovation**: Move's resource model is ideal for evidence records
- **Ecosystem Diversification**: Third chain reduces single-chain dependency
- **Prize Potential**: Possible $30,000 return on ~$4,300 investment
- **Team Growth**: Move language expertise benefits future projects

### Negative

- **Engineering Distraction**: 4 weeks diverted from other priorities
- **Unproven Network**: Movement lacks Solana's track record
- **Language Learning**: Move requires new skills (not JavaScript/Rust)
- **Maintenance Burden**: If adopted, third chain increases operational
  complexity

### Neutral

- **No Production Commitment**: Pilot is evaluation-only
- **Reversible**: Can abandon without production impact

---

## Decision Criteria for Production Adoption

After hackathon, Movement integration proceeds to production if:

| Criterion                | Threshold                       |
| ------------------------ | ------------------------------- |
| **Finality Latency**     | ≤500ms average                  |
| **Transaction Success**  | ≥99%                            |
| **Cost Efficiency**      | ≤$0.001/tx                      |
| **Network Uptime**       | ≥99.5% during pilot             |
| **Developer Experience** | Team rates ≥7/10                |
| **Ecosystem Trajectory** | Growing TVL, developer activity |

---

## Appendix: Move vs Solidity for Evidence

| Aspect                  | Move                           | Solidity                | Winner for Evidence |
| ----------------------- | ------------------------------ | ----------------------- | ------------------- |
| **Resource Safety**     | Native (linear types)          | Manual (checks-effects) | Move                |
| **Reentrancy**          | Impossible                     | Common vulnerability    | Move                |
| **Formal Verification** | Move Prover built-in           | External tools          | Move                |
| **Ecosystem Size**      | Growing (Aptos, Sui, Movement) | Mature (Ethereum, L2s)  | Solidity            |
| **Tooling**             | Newer                          | Extensive               | Solidity            |
| **Developer Pool**      | Limited                        | Large                   | Solidity            |

**Conclusion**: Move's security model is technically superior for evidence
records, but Solidity has ecosystem advantages. Movement's EVM compatibility
provides best of both worlds.

---

## Related ADRs

- [ADR 0001: Chain Selection for On-Chain Anchoring](./architecture-decision-records#adr-0001-chain-selection-for-on-chain-anchoring-solana-vs-others)
- [ADR 0002: Solana Memo vs Smart Contract Approach](./architecture-decision-records#adr-0002-solana-memo-vs-smart-contract-approach)
- [ADR 0004: Layered Strategy (L1/L2/L3)](./architecture-decision-records#adr-0004-layered-strategy-l1l2l3)
- [ADR-D002: Dual Blockchain Anchoring (Solana + EtherLink)](./architecture-decision-records#adr-d002-dual-blockchain-anchoring-solana--etherlink)
- [ADR-D007: Evidence-Based Architecture](./architecture-decision-records#adr-d007-evidence-based-architecture)

---

## References

- [Movement Network Documentation](https://docs.movementnetwork.xyz/)
- [Move Language Book](https://move-book.com/)
- [Movement M1 Hackathon (Encode Club)](https://www.encode.club/movement-m1-hackathon)
- [Move Prover (Formal Verification)](https://github.com/move-language/move/tree/main/language/move-prover)

---

_© 2025 Phoenix Rooivalk. Confidential._
