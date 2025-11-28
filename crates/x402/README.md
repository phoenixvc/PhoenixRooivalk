# phoenix-x402

x402 Payment Protocol integration for Phoenix Rooivalk evidence verification API.

## Overview

This crate implements HTTP 402 "Payment Required" protocol support for monetizing the Phoenix Rooivalk evidence verification API. It enables instant micropayments via Solana without requiring account creation, OAuth flows, or subscription management.

## Features

- **Zero Protocol Fees**: 0% vs 2.9% + $0.30 for traditional processors
- **Micropayment-Friendly**: Transactions as low as $0.001 are viable
- **AI Agent-Native**: Designed for autonomous agent-to-agent payments
- **Solana Settlement**: 400ms finality, $0.00025/transaction

## Price Tiers

| Tier | Price (USDC) | Description |
|------|--------------|-------------|
| Basic | $0.01 | Single-chain evidence verification |
| Multi-Chain | $0.05 | Cross-chain (Solana + EtherLink) verification |
| Legal Attestation | $1.00 | Court-admissible certification |
| Bulk | $0.005/ea | 100+ verifications |

## Usage

### Configuration

Set environment variables:

```bash
X402_ENABLED=true
X402_WALLET_ADDRESS=<your-solana-wallet>
X402_FACILITATOR_URL=https://x402.org/facilitator
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
```

### API Endpoints

#### Get x402 Status
```
GET /api/v1/x402/status
```

Returns current x402 configuration and pricing.

#### Premium Evidence Verification
```
POST /api/v1/evidence/verify-premium
Content-Type: application/json

{
  "evidence_id": "evt-2025-001",
  "tier": "basic"
}
```

**Without Payment**: Returns 402 with payment details
**With X-PAYMENT Header**: Returns verified evidence

## Protocol Flow

```
┌─────────────────────────────────────────────────────────────┐
│              x402 Payment Flow                               │
├─────────────────────────────────────────────────────────────┤
│  1. Client Request (no payment)                              │
│       │                                                      │
│       ▼                                                      │
│  2. API returns HTTP 402 with payment details                │
│       │                                                      │
│       ▼                                                      │
│  3. Client pays via Solana (USDC)                           │
│       │                                                      │
│       ▼                                                      │
│  4. Client retries with X-PAYMENT header                    │
│       │                                                      │
│       ▼                                                      │
│  5. API verifies payment → Returns evidence                 │
└─────────────────────────────────────────────────────────────┘
```

## Testing

Run tests with:

```bash
cargo test --package phoenix-x402
```

## Related Documentation

- [ADR-0016: x402 Payment Protocol](../../apps/docs/docs/technical/architecture/adr-0016-x402-payment-protocol.md)
- [x402.org](https://www.x402.org/)
- [Solana x402 Documentation](https://solana.com/x402/what-is-x402)
