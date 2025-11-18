# Architecture Decision Records (ADRs)

This document captures key architectural decisions made during the development of Phoenix Rooivalk.

## Table of Contents

1. [ADR-001: Monorepo Structure with Turborepo](#adr-001-monorepo-structure-with-turborepo)
2. [ADR-002: Dual Blockchain Anchoring](#adr-002-dual-blockchain-anchoring)
3. [ADR-003: Rust for Backend Services](#adr-003-rust-for-backend-services)
4. [ADR-004: Next.js for Marketing Site](#adr-004-nextjs-for-marketing-site)
5. [ADR-005: SQLite for Outbox Pattern](#adr-005-sqlite-for-outbox-pattern)
6. [ADR-006: WASM Threat Simulator with Leptos](#adr-006-wasm-threat-simulator-with-leptos)
7. [ADR-007: Evidence-Based Architecture](#adr-007-evidence-based-architecture)
8. [ADR-008: Address Validation Module](#adr-008-address-validation-module)
9. [ADR-009: TypeScript Shared Packages](#adr-009-typescript-shared-packages)
10. [ADR-010: Iframe Isolation for WASM](#adr-010-iframe-isolation-for-wasm)

---

## ADR-001: Monorepo Structure with Turborepo

**Status:** Accepted  
**Date:** 2024-01-15  
**Context:** Need to manage multiple applications (marketing, docs, API, keeper) and shared packages efficiently.

### Decision

Use a monorepo structure with Turborepo for build orchestration and pnpm for package management.

### Rationale

- **Code Sharing**: Shared types, UI components, and utilities across apps
- **Atomic Changes**: Single PR can update multiple apps simultaneously
- **Build Performance**: Turborepo provides intelligent caching and parallel execution
- **Developer Experience**: Single `pnpm install`, unified tooling configuration

### Consequences

**Positive:**
- Simplified dependency management
- Faster CI/CD with smart caching
- Easier refactoring across packages
- Consistent tooling and linting

**Negative:**
- Larger repository size
- More complex CI/CD configuration
- Learning curve for monorepo patterns

### Alternatives Considered

- **Polyrepo**: Rejected due to code duplication and versioning complexity
- **Lerna**: Rejected in favor of Turborepo's superior caching
- **Nx**: Rejected due to Turborepo's simplicity and Next.js integration

---

## ADR-002: Dual Blockchain Anchoring

**Status:** Accepted  
**Date:** 2024-01-20  
**Context:** Need tamper-proof evidence trail for military compliance and legal defensibility.

### Decision

Implement dual-chain anchoring to both Solana and EtherLink blockchains.

### Rationale

- **Redundancy**: Multiple chains provide backup if one fails
- **Speed vs Cost**: Solana for fast confirmations, EtherLink for Ethereum ecosystem compatibility
- **Legal Compliance**: Multiple independent witnesses strengthen legal validity
- **Cross-Chain Verification**: Independent verification from different consensus mechanisms

### Consequences

**Positive:**
- Enhanced tamper-resistance
- Geographic and technical diversity
- Compliance with multiple regulatory frameworks
- Future-proof against single-chain failures

**Negative:**
- Increased operational complexity
- Higher anchoring costs
- More complex verification logic
- Potential synchronization issues

### Implementation

```rust
// crates/evidence/src/anchor.rs
pub trait AnchorProvider {
    async fn anchor(&self, evidence: &EvidenceRecord) -> Result<ChainTxRef>;
    async fn confirm(&self, tx: &ChainTxRef) -> Result<ChainTxRef>;
}
```

---

## ADR-003: Rust for Backend Services

**Status:** Accepted  
**Date:** 2024-01-22  
**Context:** Need high-performance, secure backend services for API, keeper, and CLI tools.

### Decision

Use Rust with Axum for all backend services and command-line tools.

### Rationale

- **Memory Safety**: Eliminates entire classes of security vulnerabilities
- **Performance**: Near C/C++ performance for blockchain operations
- **Concurrency**: Tokio async runtime for high-throughput I/O
- **Type Safety**: Compile-time guarantees reduce runtime errors
- **Cryptography**: Strong ecosystem for cryptographic operations

### Consequences

**Positive:**
- Minimal memory footprint
- No garbage collection pauses
- Strong compile-time guarantees
- Excellent WebAssembly support

**Negative:**
- Steeper learning curve
- Slower initial development
- Smaller talent pool
- Longer compile times

### Technology Stack

- **Web Framework**: Axum 0.8
- **Async Runtime**: Tokio 1.48
- **Database**: SQLx with SQLite
- **Serialization**: serde with serde_json

---

## ADR-004: Next.js for Marketing Site

**Status:** Accepted  
**Date:** 2024-01-25  
**Context:** Need modern, performant marketing website with SEO optimization.

### Decision

Use Next.js 14 with static export for the marketing website.

### Rationale

- **SEO**: Server-side rendering and static generation for search engines
- **Performance**: Automatic code splitting and optimization
- **Developer Experience**: Hot reload, TypeScript support, file-based routing
- **Deployment**: Static export works with any hosting (Netlify, Vercel, S3)
- **React Ecosystem**: Access to vast component libraries

### Consequences

**Positive:**
- Excellent Lighthouse scores
- Fast initial page loads
- Easy integration with React component libraries
- Strong TypeScript support

**Negative:**
- Next.js-specific patterns and conventions
- Build complexity for static export
- Client-side hydration overhead

### Configuration

```javascript
// next.config.js
module.exports = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};
```

---

## ADR-005: SQLite for Outbox Pattern

**Status:** Accepted  
**Date:** 2024-02-01  
**Context:** Need reliable outbox pattern for queuing blockchain anchoring jobs.

### Decision

Use SQLite with SQLx for the blockchain outbox pattern.

### Rationale

- **Simplicity**: No separate database server required
- **ACID Transactions**: Full transactional support
- **Portability**: Single file, easy backup and migration
- **Performance**: Sufficient for single-instance keeper service
- **Reliability**: Mature, battle-tested database

### Consequences

**Positive:**
- Zero configuration
- Easy local development
- Built-in backup (file copy)
- No network latency

**Negative:**
- Single-writer limitation
- No horizontal scaling
- Limited concurrent connections
- Manual replication if needed

### Schema

```sql
CREATE TABLE outbox_jobs (
    id TEXT PRIMARY KEY,
    payload_sha256 TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_ms INTEGER NOT NULL,
    updated_ms INTEGER NOT NULL,
    next_attempt_ms INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE outbox_tx_refs (
    job_id TEXT NOT NULL,
    network TEXT NOT NULL,
    chain TEXT NOT NULL,
    tx_id TEXT NOT NULL,
    confirmed INTEGER NOT NULL DEFAULT 0,
    timestamp INTEGER,
    PRIMARY KEY (job_id, network, chain, tx_id)
);
```

---

## ADR-006: WASM Threat Simulator with Leptos

**Status:** Accepted  
**Date:** 2024-02-10  
**Context:** Need high-performance threat simulation that runs in the browser.

### Decision

Build threat simulator in Rust with Leptos, compile to WebAssembly.

### Rationale

- **Performance**: Native-speed computation for physics and collision detection
- **Code Reuse**: Share logic between desktop (Tauri) and web versions
- **Type Safety**: Rust type system prevents runtime errors
- **Size**: Smaller bundle than equivalent JavaScript
- **Future-Proof**: WASM is increasingly well-supported

### Consequences

**Positive:**
- 60 FPS performance with complex simulations
- Code sharing between platforms
- Memory safety for complex game logic
- Smaller download size

**Negative:**
- WASM bundle still ~2MB
- Browser compatibility concerns
- Debugging complexity
- Limited DOM manipulation

### Implementation

- **Framework**: Leptos (reactive UI)
- **Build Tool**: Trunk
- **Embedding**: Iframe isolation for DOM safety

---

## ADR-007: Evidence-Based Architecture

**Status:** Accepted  
**Date:** 2024-02-15  
**Context:** Core system architecture must support military-grade audit trails.

### Decision

Design entire system around immutable evidence records with cryptographic proofs.

### Rationale

- **Audit Trail**: Every action creates an evidence record
- **Non-Repudiation**: Cryptographic proofs prevent denial
- **Compliance**: Meets regulatory requirements for defense systems
- **Time-Series**: Natural chronological ordering
- **Blockchain-Ready**: Evidence records designed for anchoring

### Consequences

**Positive:**
- Legal defensibility
- Regulatory compliance
- Complete audit history
- Tamper detection

**Negative:**
- Storage requirements grow continuously
- No data deletion (append-only)
- Complex GDPR compliance
- Event sourcing complexity

### Evidence Model

```rust
pub struct EvidenceRecord {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub digest: EvidenceDigest,
    pub payload_mime: Option<String>,
    pub metadata: serde_json::Value,
}

pub struct ChainTxRef {
    pub network: String,
    pub chain: String,
    pub tx_id: String,
    pub confirmed: bool,
    pub timestamp: Option<DateTime<Utc>>,
}
```

---

## ADR-008: Address Validation Module

**Status:** Accepted  
**Date:** 2024-02-20  
**Context:** Need to validate blockchain addresses for multiple chains.

### Decision

Create dedicated crate for cross-chain address validation with EIP-55 checksum support.

### Rationale

- **Safety**: Prevent funds loss from invalid addresses
- **User Experience**: Immediate feedback on address errors
- **Compliance**: Proper checksums reduce human error
- **Extensibility**: Easy to add new chain support

### Consequences

**Positive:**
- Prevents costly mistakes
- Improves UX with instant validation
- Supports multiple chains
- Strong type safety

**Negative:**
- Maintenance burden for new chains
- Checksum computation overhead
- Complex validation rules

---

## ADR-009: TypeScript Shared Packages

**Status:** Accepted  
**Date:** 2024-03-01  
**Context:** Need shared type definitions and utilities across frontend apps.

### Decision

Create shared TypeScript packages for types, UI components, and utilities.

### Rationale

- **Type Safety**: Shared types ensure API contract compliance
- **DRY**: Single source of truth for common logic
- **Consistency**: Unified UI components across apps
- **Productivity**: Reusable utilities and hooks

### Consequences

**Positive:**
- Type-safe API contracts
- Consistent UI/UX
- Faster feature development
- Easier refactoring

**Negative:**
- Circular dependency risk
- Breaking changes affect multiple apps
- Package versioning complexity

### Package Structure

```
packages/
├── types/       # Core type definitions
├── ui/          # React UI components
└── utils/       # Shared utilities
```

---

## ADR-010: Iframe Isolation for WASM

**Status:** Accepted  
**Date:** 2024-03-05  
**Context:** Leptos WASM app was rendering outside designated container.

### Decision

Embed WASM simulator via iframe for true DOM isolation.

### Rationale

- **DOM Isolation**: Prevents WASM from affecting parent page
- **CSS Isolation**: No style conflicts with parent
- **Fullscreen Support**: Native fullscreen API support
- **Security**: Additional sandboxing layer

### Consequences

**Positive:**
- True isolation from parent DOM
- No CSS conflicts
- Proper fullscreen behavior
- Enhanced security

**Negative:**
- IPC complexity for parent-child communication
- Extra HTTP request for iframe content
- Slight performance overhead

### Implementation

```tsx
<iframe
  src="/wasm-embed.html"
  allow="fullscreen"
  sandbox="allow-scripts allow-same-origin allow-modals"
/>
```

---

## Review Process

ADRs should be reviewed and approved by:
- Technical Lead
- Security Team (for security-sensitive decisions)
- Legal Team (for compliance-related decisions)

## Revision History

All ADRs are immutable once accepted. Changes require:
1. Mark original ADR as "Superseded"
2. Create new ADR with "Supersedes ADR-XXX"

---

*Last Updated: November 18, 2024*
